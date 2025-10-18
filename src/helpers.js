const config = require('./config');

/**
 * Helper utilities for TradingView API
 */
class TradingViewHelpers {
  /**
   * Create a chart with default settings
   * @param {Object} client - TradingView client instance
   * @param {Object} options - Chart options
   * @returns {Object} Chart instance
   */
  static createChart(client, options = {}) {
    const chart = new client.Session.Chart();

    const chartOptions = {
      timeframe: options.timeframe || config.market.timeframe,
      type: options.type || config.market.chartType,
      ...options,
    };

    // Set default market if none specified
    if (!options.market) {
      chart.setMarket(config.market.default, chartOptions);
    } else {
      chart.setMarket(options.market, chartOptions);
    }

    return chart;
  }

  /**
   * Setup common chart event handlers
   * @param {Object} chart - Chart instance
   * @param {Object} options - Handler options
   */
  static setupChartHandlers(chart, options = {}) {
    const {
      onError = true,
      onSymbolLoaded = true,
      onUpdate = true,
      onReady = true,
    } = options;

    if (onError) {
      chart.onError((...err) => {
        console.error('📊 Chart error:', ...err);
      });
    }

    if (onSymbolLoaded) {
      chart.onSymbolLoaded(() => {
        console.log(`✅ Market "${chart.infos.description}" loaded!`);
      });
    }

    if (onUpdate) {
      chart.onUpdate(() => {
        if (!chart.periods[0]) return;
        const period = chart.periods[0];
        console.log(
          `📈 [${chart.infos.description}]: ${period.close} ${chart.infos.currency_id}`,
        );
      });
    }

    if (onReady) {
      chart.onReady(() => {
        console.log('🚀 Chart is ready!');
      });
    }
  }

  /**
   * Wait for a specified amount of time
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Promise that resolves after the delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute a function with retry logic
   * @param {Function} fn - Function to execute
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delayMs - Delay between retries in milliseconds
   * @returns {Promise} Promise that resolves with the function result
   */
  static async retry(
    fn,
    maxRetries = config.connection.maxRetries,
    delayMs = 1000,
  ) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        console.warn(`⚠️  Attempt ${attempt} failed: ${error.message}`);

        if (attempt < maxRetries) {
          console.log(`🔄 Retrying in ${delayMs}ms...`);
          await this.delay(delayMs);
        }
      }
    }

    throw new Error(
      `Failed after ${maxRetries} attempts. Last error: ${lastError.message}`,
    );
  }

  /**
   * Format market data for display
   * @param {Object} period - Market period data
   * @param {string} currency - Currency symbol
   * @returns {string} Formatted string
   */
  static formatMarketData(period, currency = '') {
    const { open, high, low, close, volume } = period;
    const change = close - open;
    const changePercent = ((change / open) * 100).toFixed(2);

    return {
      price: close,
      change: change.toFixed(4),
      changePercent: `${changePercent}%`,
      range: `${low} - ${high}`,
      volume: volume ? volume.toLocaleString() : 'N/A',
      currency,
    };
  }

  /**
   * Validate market symbol format
   * @param {string} symbol - Market symbol to validate
   * @returns {boolean} True if valid format
   */
  static isValidMarketSymbol(symbol) {
    // Basic validation for common market formats
    const patterns = [
      /^[A-Z]+:[A-Z]+$/, // EXCHANGE:SYMBOL
      /^[A-Z]+:[A-Z]+[0-9]*$/, // EXCHANGE:SYMBOL123
      /^[A-Z]+:[A-Z]+[A-Z0-9]*$/, // EXCHANGE:SYMBOL123
    ];

    return patterns.some(pattern => pattern.test(symbol));
  }

  /**
   * Get timeframe options
   * @returns {Object} Available timeframes
   */
  static getTimeframes() {
    return {
      1: '1 minute',
      5: '5 minutes',
      15: '15 minutes',
      30: '30 minutes',
      60: '1 hour',
      240: '4 hours',
      '1D': '1 day',
      '1W': '1 week',
      '1M': '1 month',
    };
  }

  /**
   * Get chart type options
   * @returns {Object} Available chart types
   */
  static getChartTypes() {
    return {
      Bars: 'Bars',
      Candles: 'Candles',
      HollowCandles: 'Hollow Candles',
      HeikinAshi: 'Heikin Ashi',
      Line: 'Line',
      Area: 'Area',
      Baseline: 'Baseline',
    };
  }

  /**
   * Safe JSON parsing with error handling
   * @param {string} jsonString - JSON string to parse
   * @param {*} defaultValue - Default value if parsing fails
   * @returns {*} Parsed object or default value
   */
  static safeJsonParse(jsonString, defaultValue = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('⚠️  JSON parsing failed:', error.message);
      return defaultValue;
    }
  }

  /**
   * Create a promise that resolves after a timeout
   * @param {number} ms - Timeout in milliseconds
   * @param {string} message - Error message
   * @returns {Promise} Promise that rejects after timeout
   */
  static timeout(ms, message = 'Operation timed out') {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }
}

module.exports = TradingViewHelpers;
