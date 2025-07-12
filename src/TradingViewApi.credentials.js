const axios = require('axios');
const { genAuthCookies } = require('./utils');

/**
 * Global TradingView API credentials and session management
 * Provides centralized authentication, validation, and session handling
 */
class TradingViewApiCredentials {
  constructor() {
    this.sessionId = null;
    this.signature = null;
    this.authToken = null;
    this.isAuthenticated = false;
    this.user = null;
    this.lastValidationTime = null;
    this.validationIntervalMs = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Set global credentials
   * @param {string} sessionId - User session ID (sessionid cookie)
   * @param {string} [signature] - User session signature (sessionid_sign cookie)
   */
  setCredentials(sessionId, signature = '') {
    this.sessionId = sessionId;
    this.signature = signature;
    this.isAuthenticated = !!(sessionId);
    this.lastValidationTime = null; // Force revalidation
  }

  /**
   * Get current credentials
   * @returns {Object} Current credentials object
   */
  getCredentials() {
    return {
      sessionId: this.sessionId,
      signature: this.signature,
      authToken: this.authToken,
      isAuthenticated: this.isAuthenticated,
      user: this.user,
    };
  }

  /**
   * Get authentication cookies string
   * @returns {string} Cookie string for requests
   */
  getAuthCookies() {
    if (!this.sessionId) return '';
    return genAuthCookies(this.sessionId, this.signature);
  }

  /**
   * Get authentication headers for requests
   * @returns {Object} Headers object with authentication
   */
  getAuthHeaders() {
    const headers = {
      origin: 'https://www.tradingview.com',
      referer: 'https://www.tradingview.com',
      'user-agent': 'TradingView-API/3.5.1',
    };

    if (this.sessionId) {
      headers.cookie = this.getAuthCookies();
    }

    return headers;
  }

  /**
   * Validate current credentials
   * @param {boolean} [force=false] - Force validation even if recently validated
   * @returns {Promise<boolean>} True if credentials are valid
   */
  async validateCredentials(force = false) {
    if (!this.sessionId) {
      this.isAuthenticated = false;
      return false;
    }

    // Check if we need to validate
    const now = Date.now();
    if (!force && this.lastValidationTime
        && (now - this.lastValidationTime) < this.validationIntervalMs) {
      return this.isAuthenticated;
    }

    try {
      const { data } = await axios.get('https://www.tradingview.com/', {
        headers: this.getAuthHeaders(),
        maxRedirects: 0,
        validateStatus: (status) => status < 500,
        timeout: 10000,
      });

      if (data.includes('auth_token')) {
        this.authToken = /"auth_token":"(.*?)"/.exec(data)?.[1];
        this.user = {
          id: /"id":([0-9]{1,10}),/.exec(data)?.[1],
          username: /"username":"(.*?)"/.exec(data)?.[1],
          firstName: /"first_name":"(.*?)"/.exec(data)?.[1],
          lastName: /"last_name":"(.*?)"/.exec(data)?.[1],
        };
        this.isAuthenticated = true;
        this.lastValidationTime = now;
        return true;
      }

      this.isAuthenticated = false;
      return false;
    } catch (error) {
      console.warn('Credential validation failed:', error.message);
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Clear all credentials
   */
  clearCredentials() {
    this.sessionId = null;
    this.signature = null;
    this.authToken = null;
    this.isAuthenticated = false;
    this.user = null;
    this.lastValidationTime = null;
  }

  /**
   * Check if credentials are set
   * @returns {boolean} True if credentials are available
   */
  hasCredentials() {
    return !!(this.sessionId);
  }

  /**
   * Get credential status for health checks
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      hasCredentials: this.hasCredentials(),
      isAuthenticated: this.isAuthenticated,
      lastValidated: this.lastValidationTime
        ? new Date(this.lastValidationTime).toISOString() : null,
      user: this.user ? {
        id: this.user.id,
        username: this.user.username,
      } : null,
    };
  }
}

// Global singleton instance
const globalCredentials = new TradingViewApiCredentials();

module.exports = {
  TradingViewApiCredentials,
  globalCredentials,
};
