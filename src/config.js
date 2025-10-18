const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Configuration manager for TradingView API
 */
class Config {
  constructor() {
    this.validateConfig();
  }

  /**
   * Validate required configuration
   */
  validateConfig() {
    const required = ['TRADINGVIEW_USERNAME', 'TRADINGVIEW_PASSWORD'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.warn(
        `⚠️  Missing required environment variables: ${missing.join(', ')}`,
      );
      console.warn(
        'Please check your .env file or set these variables in your environment',
      );
    }
  }

  /**
   * Get authentication credentials
   */
  get auth() {
    return {
      username: process.env.TRADINGVIEW_USERNAME,
      password: process.env.TRADINGVIEW_PASSWORD,
      sessionId: process.env.TRADINGVIEW_SESSION_ID,
      signature: process.env.TRADINGVIEW_SIGNATURE,
      userAgent: process.env.TRADINGVIEW_USER_AGENT || 'TWAPI/3.0',
      rememberSession: process.env.TRADINGVIEW_REMEMBER_SESSION !== 'false',
    };
  }

  /**
   * Get default market settings
   */
  get market() {
    return {
      default: process.env.DEFAULT_MARKET || 'BINANCE:BTCEUR',
      timeframe: process.env.DEFAULT_TIMEFRAME || 'D',
      chartType: process.env.DEFAULT_CHART_TYPE || 'HeikinAshi',
    };
  }

  /**
   * Get connection settings
   */
  get connection() {
    return {
      websocketTimeout: parseInt(process.env.WEBSOCKET_TIMEOUT) || 30000,
      requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 10000,
      maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    };
  }

  /**
   * Get logging configuration
   */
  get logging() {
    return {
      level: process.env.LOG_LEVEL || 'info',
      debug: process.env.ENABLE_DEBUG === 'true',
    };
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated() {
    return !!(this.auth.username && this.auth.password);
  }

  /**
   * Check if session is available
   */
  get hasSession() {
    return !!(this.auth.sessionId && this.auth.signature);
  }

  /**
   * Get all configuration
   */
  get all() {
    return {
      auth: this.auth,
      market: this.market,
      connection: this.connection,
      logging: this.logging,
      isAuthenticated: this.isAuthenticated,
      hasSession: this.hasSession,
    };
  }
}

module.exports = new Config();
