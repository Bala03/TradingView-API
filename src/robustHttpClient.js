const axios = require('axios');
const { globalCredentials } = require('./TradingViewApi.credentials');

/**
 * Robust HTTP client with retry logic, rate limiting, and error handling
 */
class RobustHttpClient {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 10000; // 10 seconds
    this.rateLimit = options.rateLimit || {
      requests: 100,
      window: 60000
    }; // 100 requests per minute

    // Rate limiting tracking
    this.requestHistory = [];

    // Request statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      rateLimitedRequests: 0,
    };
  }

  /**
   * Check if we're hitting rate limits
   * @returns {boolean} True if rate limited
   */
  isRateLimited() {
    const now = Date.now();
    const windowStart = now - this.rateLimit.window;

    // Clean old requests
    this.requestHistory = this.requestHistory.filter((time) => time > windowStart);

    return this.requestHistory.length >= this.rateLimit.requests;
  }

  /**
   * Calculate delay for rate limiting
   * @returns {number} Delay in milliseconds
   */
  getRateLimitDelay() {
    if (this.requestHistory.length === 0) return 0;

    const oldestRequest = Math.min(...this.requestHistory);
    const windowStart = Date.now() - this.rateLimit.window;

    if (oldestRequest <= windowStart) return 0;

    return oldestRequest + this.rateLimit.window - Date.now();
  }

  /**
   * Calculate exponential backoff delay
   * @param {number} attempt - Current attempt number (0-based)
   * @param {boolean} isRateLimit - Whether this is a rate limit retry
   * @returns {number} Delay in milliseconds
   */
  getBackoffDelay(attempt, isRateLimit = false) {
    if (isRateLimit) {
      // Progressive backoff for rate limits: 5s, 10s, 20s
      return Math.min(5000 * 2 ** attempt, this.maxDelay);
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = this.baseDelay * 2 ** attempt;
    return Math.min(delay, this.maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   */
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Make a robust HTTP request with retry logic
   * @param {Object} config - Axios request configuration
   * @returns {Promise<Object>} Response data
   */
  async request(config) {
    this.stats.totalRequests++;

    // Add authentication headers
    const authHeaders = globalCredentials.getAuthHeaders();
    config.headers = { ...authHeaders, ...config.headers };

    // Default configurations
    config.timeout = config.timeout || 30000;
    config.validateStatus = config.validateStatus || ((status) => status < 500);

    let lastError = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        // Check rate limiting before making request
        if (this.isRateLimited()) {
          const rateLimitDelay = this.getRateLimitDelay();
          if (rateLimitDelay > 0) {
            this.stats.rateLimitedRequests++;
            console.warn(`Rate limited. Waiting ${rateLimitDelay}ms before retry...`);
            await this.sleep(rateLimitDelay);
          }
        }

        // Record request time for rate limiting
        this.requestHistory.push(Date.now());

        const response = await axios(config);

        // Handle specific HTTP status codes
        if (response.status === 429) {
          // Rate limited by server
          const retryAfter = response.headers['retry-after'];
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : this.getBackoffDelay(attempt, true);

          if (attempt < this.maxRetries) {
            this.stats.rateLimitedRequests++;
            console.warn(`Server rate limit (429). Retrying after ${delay}ms...`);
            await this.sleep(delay);
            continue;
          }

          throw new Error(`Rate limited by server after ${this.maxRetries + 1} attempts`);
        }

        if (response.status === 401 || response.status === 403) {
          // Authentication issues
          throw new Error(`Authentication failed (${response.status}). Please check your session ID and signature.`);
        }

        if (response.status >= 400) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Success
        this.stats.successfulRequests++;
        return response;
      } catch (error) {
        lastError = error;

        // Don't retry on authentication errors
        if (error.message.includes('Authentication failed')) {
          this.stats.failedRequests++;
          throw error;
        }

        // Don't retry on client errors (4xx except 429)
        if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
          this.stats.failedRequests++;
          throw error;
        }

        // Retry on network errors, timeouts, and server errors (5xx)
        if (attempt < this.maxRetries) {
          const delay = this.getBackoffDelay(attempt);
          this.stats.retriedRequests++;
          console.warn(`Request failed (attempt ${attempt + 1}/${this.maxRetries + 1}): ${error.message}. Retrying after ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }

        // Max retries exceeded
        this.stats.failedRequests++;
        throw new Error(`Request failed after ${this.maxRetries + 1} attempts: ${error.message}`);
      }
    }

    // This should never be reached
    throw lastError;
  }

  /**
   * Make a GET request
   * @param {string} url - Request URL
   * @param {Object} [config] - Additional axios configuration
   * @returns {Promise<Object>} Response data
   */
  async get(url, config = {}) {
    return this.request({ ...config, method: 'GET', url });
  }

  /**
   * Make a POST request
   * @param {string} url - Request URL
   * @param {*} [data] - Request data
   * @param {Object} [config] - Additional axios configuration
   * @returns {Promise<Object>} Response data
   */
  async post(url, data = null, config = {}) {
    return this.request({
      ...config, method: 'POST', url, data,
    });
  }

  /**
   * Get request statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      rateLimitedRequests: 0,
    };
    this.requestHistory = [];
  }
}

// Global singleton instance
const robustHttpClient = new RobustHttpClient();

module.exports = {
  RobustHttpClient,
  robustHttpClient,
};
