const TradingView = require('./miscRequests');
const config = require('./config');

/**
 * Session Manager for TradingView API
 * Handles authentication, session management, and provides reusable sessions
 */
class SessionManager {
  constructor() {
    this.currentSession = null;
    this.isAuthenticating = false;
    this.authPromise = null;
  }

  /**
   * Get or create a valid session
   * @returns {Promise<Object>} User session object
   */
  async getSession() {
    // If we already have a valid session, return it
    if (this.currentSession && this.isSessionValid()) {
      return this.currentSession;
    }

    // If we're already authenticating, wait for that to complete
    if (this.isAuthenticating && this.authPromise) {
      return this.authPromise;
    }

    // Start authentication process
    this.isAuthenticating = true;
    this.authPromise = this.authenticate();
    
    try {
      const session = await this.authPromise;
      this.currentSession = session;
      return session;
    } finally {
      this.isAuthenticating = false;
      this.authPromise = null;
    }
  }

  /**
   * Authenticate with TradingView
   * @returns {Promise<Object>} User session object
   */
  async authenticate() {
    try {
      // Check if we have stored session credentials
      if (config.hasSession) {
        console.log('🔐 Attempting to use stored session...');
        try {
          const user = await TradingView.getUser(config.auth.sessionId, config.auth.signature);
          console.log('✅ Stored session is valid');
          return user;
        } catch (error) {
          console.log('❌ Stored session is invalid, attempting login...');
        }
      }

      // Check if we have login credentials
      if (!config.isAuthenticated) {
        throw new Error('No authentication credentials provided. Please set TRADINGVIEW_USERNAME and TRADINGVIEW_PASSWORD in your .env file');
      }

      console.log('🔐 Authenticating with TradingView...');
      const user = await TradingView.loginUser(
        config.auth.username,
        config.auth.password,
        config.auth.rememberSession,
        config.auth.userAgent
      );

      console.log('✅ Authentication successful');
      console.log(`👤 User: ${user.username} (${user.firstName} ${user.lastName})`);
      console.log(`🆔 Session ID: ${user.session}`);
      console.log(`🔑 Signature: ${user.signature}`);

      // Update environment variables with new session data
      this.updateEnvironmentSession(user.session, user.signature);

      return user;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if current session is still valid
   * @returns {boolean}
   */
  isSessionValid() {
    if (!this.currentSession) return false;
    
    // Basic validation - could be enhanced with actual session validation
    return !!(this.currentSession.session && this.currentSession.signature);
  }

  /**
   * Refresh the current session
   * @returns {Promise<Object>} New session object
   */
  async refreshSession() {
    console.log('🔄 Refreshing session...');
    this.currentSession = null;
    return this.getSession();
  }

  /**
   * Get session cookies for API requests
   * @returns {string} Cookie string
   */
  getSessionCookies() {
    if (!this.currentSession) {
      throw new Error('No active session. Call getSession() first');
    }
    
    return `sessionid=${this.currentSession.session};sessionid_sign=${this.currentSession.signature}`;
  }

  /**
   * Update environment session variables
   * @param {string} sessionId 
   * @param {string} signature 
   */
  updateEnvironmentSession(sessionId, signature) {
    // Note: This updates the current process environment
    // For persistent changes, you'd need to write to .env file
    process.env.TRADINGVIEW_SESSION_ID = sessionId;
    process.env.TRADINGVIEW_SIGNATURE = signature;
    
    console.log('💾 Session credentials updated in environment');
  }

  /**
   * Clear current session
   */
  clearSession() {
    this.currentSession = null;
    console.log('🗑️  Session cleared');
  }

  /**
   * Get session info
   * @returns {Object} Session information
   */
  getSessionInfo() {
    if (!this.currentSession) {
      return { isAuthenticated: false, message: 'No active session' };
    }

    return {
      isAuthenticated: true,
      username: this.currentSession.username,
      sessionId: this.currentSession.session,
      signature: this.currentSession.signature,
      userId: this.currentSession.id
    };
  }
}

// Export singleton instance
module.exports = new SessionManager();