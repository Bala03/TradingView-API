const WebSocket = require('ws');

const misc = require('./miscRequests');
const protocol = require('./protocol');

const quoteSessionGenerator = require('./quote/session');
const chartSessionGenerator = require('./chart/session');

/**
 * @typedef {Object} Session
 * @prop {'quote' | 'chart' | 'replay'} type Session type
 * @prop {(data: {}) => null} onData When there is a data
 */

/** @typedef {Object<string, Session>} SessionList Session list */

/**
 * @callback SendPacket Send a custom packet
 * @param {string} t Packet type
 * @param {string[]} p Packet data
 * @returns {void}
 */

/**
 * @typedef {Object} ClientBridge
 * @prop {SessionList} sessions
 * @prop {SendPacket} send
 */

/**
 * @typedef { 'connected' | 'disconnected'
 *  | 'logged' | 'ping' | 'data'
 *  | 'error' | 'event'
 * } ClientEvent
 */

/** @class */
module.exports = class Client {
  #ws;

  #logged = false;

  // Auto-reconnect properties
  #reconnectAttempts = 0;
  #reconnectTimer = null;
  #isReconnecting = false;
  #autoReconnectOptions = {};

  /** If the client is logged in */
  get isLogged() {
    return this.#logged;
  }

  /** If the cient was closed */
  get isOpen() {
    return this.#ws.readyState === this.#ws.OPEN;
  }

  /** @type {SessionList} */
  #sessions = {};

  #callbacks = {
    connected: [],
    disconnected: [],
    logged: [],
    ping: [],
    data: [],

    error: [],
    event: [],
  };

  /**
   * @param {ClientEvent} ev Client event
   * @param {...{}} data Packet data
   */
  #handleEvent(ev, ...data) {
    this.#callbacks[ev].forEach(e => e(...data));
    this.#callbacks.event.forEach(e => e(ev, ...data));
  }

  #handleError(...msgs) {
    if (this.#callbacks.error.length === 0) console.error(...msgs);
    else this.#handleEvent('error', ...msgs);
  }

  /**
   * When client is connected
   * @param {() => void} cb Callback
   * @event onConnected
   */
  onConnected(cb) {
    this.#callbacks.connected.push(cb);
  }

  /**
   * When client is disconnected
   * @param {() => void} cb Callback
   * @event onDisconnected
   */
  onDisconnected(cb) {
    this.#callbacks.disconnected.push(cb);
  }

  /**
   * @typedef {Object} SocketSession
   * @prop {string} session_id Socket session ID
   * @prop {number} timestamp Session start timestamp
   * @prop {number} timestampMs Session start milliseconds timestamp
   * @prop {string} release Release
   * @prop {string} studies_metadata_hash Studies metadata hash
   * @prop {'json' | string} protocol Used protocol
   * @prop {string} javastudies Javastudies
   * @prop {number} auth_scheme_vsn Auth scheme type
   * @prop {string} via Socket IP
   */

  /**
   * When client is logged
   * @param {(SocketSession: SocketSession) => void} cb Callback
   * @event onLogged
   */
  onLogged(cb) {
    this.#callbacks.logged.push(cb);
  }

  /**
   * When server is pinging the client
   * @param {(i: number) => void} cb Callback
   * @event onPing
   */
  onPing(cb) {
    this.#callbacks.ping.push(cb);
  }

  /**
   * When unparsed data is received
   * @param {(...{}) => void} cb Callback
   * @event onData
   */
  onData(cb) {
    this.#callbacks.data.push(cb);
  }

  /**
   * When a client error happens
   * @param {(...{}) => void} cb Callback
   * @event onError
   */
  onError(cb) {
    this.#callbacks.error.push(cb);
  }

  /**
   * When a client event happens
   * @param {(...{}) => void} cb Callback
   * @event onEvent
   */
  onEvent(cb) {
    this.#callbacks.event.push(cb);
  }

  #parsePacket(str) {
    if (!this.isOpen) return;

    protocol.parseWSPacket(str).forEach(packet => {
      if (global.TW_DEBUG) console.log('§90§30§107 CLIENT §0 PACKET', packet);
      if (typeof packet === 'number') {
        // Ping
        this.#ws.send(protocol.formatWSPacket(`~h~${packet}`));
        this.#handleEvent('ping', packet);
        return;
      }

      if (packet.m === 'protocol_error') {
        // Error
        this.#handleError('Client critical error:', packet.p);
        this.#ws.close();
        return;
      }

      if (packet.m && packet.p) {
        // Normal packet
        const parsed = {
          type: packet.m,
          data: packet.p,
        };

        const session = packet.p[0];

        if (session && this.#sessions[session]) {
          this.#sessions[session].onData(parsed);
          return;
        }
      }

      if (!this.#logged) {
        this.#handleEvent('logged', packet);
        return;
      }

      this.#handleEvent('data', packet);
    });
  }

  #sendQueue = [];

  /** @type {SendPacket} Send a custom packet */
  send(t, p = []) {
    this.#sendQueue.push(protocol.formatWSPacket({ m: t, p }));
    this.sendQueue();
  }

  /** Send all waiting packets */
  sendQueue() {
    while (this.isOpen && this.#logged && this.#sendQueue.length > 0) {
      const packet = this.#sendQueue.shift();
      this.#ws.send(packet);
      if (global.TW_DEBUG) console.log('§90§30§107 > §0', packet);
    }
  }

  /**
   * Calculate exponential backoff delay for reconnection.
   * Uses the formula: min(initialDelay * (backoffMultiplier ^ attempt), maxDelay) + jitter
   * @param {number} attempt Current attempt number (0-based)
   * @returns {number} Delay in milliseconds before next reconnection attempt
   * @example
   * // With default options: 1000ms, 2000ms, 4000ms, 8000ms, etc.
   * client.#calculateReconnectDelay(0); // ~1000-2000ms
   * client.#calculateReconnectDelay(3); // ~8000-9000ms
   */
  #calculateReconnectDelay(attempt) {
    const {
      initialDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
    } = this.#autoReconnectOptions;

    const delay = Math.min(
      initialDelay * Math.pow(backoffMultiplier, attempt),
      maxDelay,
    );

    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Attempt to reconnect WebSocket connection with exponential backoff.
   * Automatically schedules reconnection attempts until maxRetries is reached.
   * @returns {void}
   * @example
   * // This method is called automatically when connection is lost
   * // if autoReconnect is enabled in client options
   */
  #attemptReconnect() {
    if (this.#isReconnecting) return;

    const { maxRetries = 10 } = this.#autoReconnectOptions;

    if (this.#reconnectAttempts >= maxRetries) {
      this.#handleError('Max reconnection attempts reached');
      this.#isReconnecting = false;
      return;
    }

    this.#isReconnecting = true;
    const delay = this.#calculateReconnectDelay(this.#reconnectAttempts);

    if (global.TW_DEBUG) {
      console.log(
        `§90§30§107 RECONNECT §0 Attempt ${this.#reconnectAttempts + 1}/${maxRetries} in ${delay}ms`,
      );
    }

    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectAttempts++;
      this.#connectWebSocket();
    }, delay);
  }

  /**
   * Create WebSocket connection with current options.
   * Sets up all event handlers including reconnection logic.
   * @returns {void}
   * @example
   * // Called during initial connection and reconnection attempts
   * client.#connectWebSocket();
   */
  #connectWebSocket() {
    const { server = 'data' } = this.#autoReconnectOptions;

    this.#ws = new WebSocket(
      `wss://${server}.tradingview.com/socket.io/websocket?type=chart`,
      {
        origin: 'https://www.tradingview.com',
      },
    );

    this.#ws.on('open', () => {
      this.#isReconnecting = false;
      this.#reconnectAttempts = 0;

      if (global.TW_DEBUG) {
        console.log('§90§30§107 RECONNECT §0 Connection restored');
      }

      // Restore sessions after reconnection
      this.#restoreSessions();

      this.#handleEvent('connected');
      this.sendQueue();
    });

    this.#ws.on('close', (code, reason) => {
      this.#logged = false;

      if (global.TW_DEBUG) {
        console.log(
          `§90§30§107 RECONNECT §0 Connection closed: ${code} - ${reason}`,
        );
      }

      // Only attempt reconnection if auto-reconnect is enabled and this wasn't a manual close
      if (this.#autoReconnectOptions.autoReconnect && !this.#isReconnecting) {
        this.#attemptReconnect();
      }

      this.#handleEvent('disconnected');
    });

    this.#ws.on('error', error => {
      if (global.TW_DEBUG) {
        console.log('§90§30§107 RECONNECT §0 WebSocket error:', error.message);
      }

      this.#handleError('WebSocket error:', error.message);
    });

    this.#ws.on('message', data => this.#parsePacket(data));
  }

  /**
   * Restore all active sessions after reconnection.
   * Calls the onRestore() method on each session if available.
   * @returns {void}
   * @example
   * // Automatically called after successful reconnection
   * client.#restoreSessions(); // Restores all quote/chart sessions
   */
  #restoreSessions() {
    if (global.TW_DEBUG) {
      console.log(
        `§90§30§107 RECONNECT §0 Restoring ${Object.keys(this.#sessions).length} sessions`,
      );
    }

    Object.values(this.#sessions).forEach(session => {
      if (session.onRestore) {
        try {
          session.onRestore();
        } catch (error) {
          this.#handleError('Failed to restore session:', error.message);
        }
      }
    });
  }

  /**
   * @typedef {Object} ClientOptions
   * @prop {string} [token] User auth token (in 'sessionid' cookie)
   * @prop {string} [signature] User auth token signature (in 'sessionid_sign' cookie)
   * @prop {boolean} [DEBUG] Enable debug mode
   * @prop {'data' | 'prodata' | 'widgetdata'} [server] Server type
   * @prop {string} [location] Auth page location (For france: https://fr.tradingview.com/)
   * @prop {boolean} [autoReconnect=true] Enable automatic reconnection
   * @prop {number} [maxRetries=10] Maximum number of reconnection attempts
   * @prop {number} [initialDelay=1000] Initial reconnection delay in milliseconds
   * @prop {number} [maxDelay=30000] Maximum reconnection delay in milliseconds
   * @prop {number} [backoffMultiplier=2] Backoff multiplier for exponential delay
   */

  /**
   * Client object
   * @param {ClientOptions} clientOptions TradingView client options
   */
  constructor(clientOptions = {}) {
    if (clientOptions.DEBUG) global.TW_DEBUG = clientOptions.DEBUG;

    // Store auto-reconnect options
    this.#autoReconnectOptions = {
      autoReconnect: clientOptions.autoReconnect !== false, // Default to true
      maxRetries: clientOptions.maxRetries || 10,
      initialDelay: clientOptions.initialDelay || 1000,
      maxDelay: clientOptions.maxDelay || 30000,
      backoffMultiplier: clientOptions.backoffMultiplier || 2,
      server: clientOptions.server || 'data',
      location: clientOptions.location || 'https://tradingview.com',
    };

    // Create initial WebSocket connection
    this.#connectWebSocket();

    if (clientOptions.token) {
      misc
        .getUser(
          clientOptions.token,
          clientOptions.signature ? clientOptions.signature : '',
          this.#autoReconnectOptions.location,
        )
        .then(user => {
          this.#sendQueue.unshift(
            protocol.formatWSPacket({
              m: 'set_auth_token',
              p: [user.authToken],
            }),
          );
          this.#logged = true;
          this.sendQueue();
        })
        .catch(err => {
          this.#handleError('Credentials error:', err.message);
        });
    } else {
      this.#sendQueue.unshift(
        protocol.formatWSPacket({
          m: 'set_auth_token',
          p: ['unauthorized_user_token'],
        }),
      );
      this.#logged = true;
      this.sendQueue();
    }
  }

  /** @type {ClientBridge} */
  #clientBridge = {
    sessions: this.#sessions,
    send: (t, p) => this.send(t, p),
  };

  /** @namespace Session */
  Session = {
    Quote: quoteSessionGenerator(this.#clientBridge),
    Chart: chartSessionGenerator(this.#clientBridge),
  };

  /**
   * Close the websocket connection
   * @return {Promise<void>} When websocket is closed
   */
  end() {
    return new Promise(cb => {
      // Clear any pending reconnection timer
      if (this.#reconnectTimer) {
        clearTimeout(this.#reconnectTimer);
        this.#reconnectTimer = null;
      }

      // Disable auto-reconnect before closing
      this.#autoReconnectOptions.autoReconnect = false;

      if (this.#ws.readyState) this.#ws.close();
      cb();
    });
  }
};
