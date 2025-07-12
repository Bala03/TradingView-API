const { robustHttpClient } = require('./robustHttpClient');

/**
 * Market definitions for different regions
 */
const MARKETS = {
  AMERICA: {
    name: 'America',
    exchanges: ['NASDAQ', 'NYSE', 'AMEX', 'OTC', 'CBOE'],
    currency: 'USD',
    timezone: 'America/New_York',
  },
  EUROPE: {
    name: 'Europe',
    exchanges: ['LSE', 'EURONEXT', 'XETRA', 'SIX', 'BME'],
    currency: 'EUR',
    timezone: 'Europe/London',
  },
  ASIA: {
    name: 'Asia',
    exchanges: ['TSE', 'HKEX', 'SGX', 'KRX', 'TWSE'],
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
  },
  AUSTRALIA: {
    name: 'Australia',
    exchanges: ['ASX', 'NSXA'],
    currency: 'AUD',
    timezone: 'Australia/Sydney',
  },
  CANADA: {
    name: 'Canada',
    exchanges: ['TSX', 'TSXV', 'CSE'],
    currency: 'CAD',
    timezone: 'America/Toronto',
  },
  INDIA: {
    name: 'India',
    exchanges: ['BSE', 'NSE'],
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  },
};

/**
 * Available data columns for market scanning
 */
const SCAN_COLUMNS = {
  // Basic data
  name: 'Name',
  close: 'Price',
  change: 'Change',
  change_abs: 'Change Absolute',
  'Perf.W': 'Performance 1 Week',
  'Perf.1M': 'Performance 1 Month',
  'Perf.3M': 'Performance 3 Months',
  'Perf.6M': 'Performance 6 Months',
  'Perf.Y': 'Performance 1 Year',
  'Perf.YTD': 'Performance YTD',

  // Volume and market cap
  volume: 'Volume',
  market_cap_basic: 'Market Cap',
  float_shares_outstanding: 'Float Shares',
  shares_outstanding: 'Shares Outstanding',

  // Financial ratios
  price_earnings_ttm: 'P/E Ratio (TTM)',
  price_book_fq: 'P/B Ratio',
  price_sales_ttm: 'P/S Ratio',
  enterprise_value_ebitda_ttm: 'EV/EBITDA',
  dividend_yield_recent: 'Dividend Yield',

  // Technical indicators
  RSI: 'RSI (14)',
  'RSI[1]': 'RSI (14) [1]',
  'Stoch.K': 'Stochastic %K',
  'Stoch.D': 'Stochastic %D',
  'MACD.macd': 'MACD',
  'MACD.signal': 'MACD Signal',
  ADX: 'ADX (14)',
  'Williams.R': 'Williams %R',
  CCI20: 'CCI (20)',
  ATR: 'ATR (14)',
  'BB.upper': 'Bollinger Bands Upper',
  'BB.lower': 'Bollinger Bands Lower',
  SMA10: 'SMA (10)',
  SMA20: 'SMA (20)',
  SMA50: 'SMA (50)',
  SMA200: 'SMA (200)',
  EMA10: 'EMA (10)',
  EMA20: 'EMA (20)',
  EMA50: 'EMA (50)',
  EMA200: 'EMA (200)',

  // Recommendations
  'Recommend.Other': 'Recommendation Other',
  'Recommend.All': 'Recommendation All',
  'Recommend.MA': 'Recommendation MA',
};

/**
 * Filter operations for market scanning
 */
const FILTER_OPERATIONS = {
  greater: '>',
  less: '<',
  egreater: '>=',
  eless: '<=',
  equal: '=',
  not_equal: '!=',
  in_range: 'in_range',
  not_in_range: 'not_in_range',
  match: 'match',
};

/**
 * Comprehensive TradingView Market Data API
 */
class TradingViewMarketData {
  constructor() {
    this.defaultTimeout = 30000;
  }

  /**
   * Get available markets
   * @returns {Object} Markets configuration
   */
  static getAvailableMarkets() {
    return MARKETS;
  }

  /**
   * Get available scan columns
   * @returns {Object} Available columns
   */
  static getAvailableColumns() {
    return SCAN_COLUMNS;
  }

  /**
   * Get available filter operations
   * @returns {Object} Filter operations
   */
  static getFilterOperations() {
    return FILTER_OPERATIONS;
  }

  /**
   * Fetch market overview data
   * @param {string} market - Market region (AMERICA, EUROPE, etc.)
   * @param {Object} [options] - Fetch options
   * @param {string[]} [options.columns] - Columns to fetch
   * @param {number} [options.limit] - Number of results to fetch
   * @param {Object[]} [options.filters] - Filters to apply
   * @returns {Promise<Object>} Market overview data
   */
  async getMarketOverview(market = 'AMERICA', options = {}) {
    const marketConfig = MARKETS[market.toUpperCase()];
    if (!marketConfig) {
      throw new Error(`Invalid market: ${market}. Available markets: ${Object.keys(MARKETS).join(', ')}`);
    }

    const columns = options.columns || ['name', 'close', 'change', 'volume', 'market_cap_basic'];
    const limit = options.limit || 50;

    // Build the scan query
    const scanData = {
      filter: options.filters || [],
      options: {
        lang: 'en',
      },
      symbols: {
        query: {
          types: ['stock'],
        },
        tickers: [],
      },
      columns,
      sort: {
        sortBy: 'market_cap_basic',
        sortOrder: 'desc',
      },
      range: [0, limit],
    };

    // Add market-specific exchanges filter if specified
    if (marketConfig.exchanges && marketConfig.exchanges.length > 0) {
      scanData.filter.push({
        left: 'exchange',
        operation: 'in_range',
        right: marketConfig.exchanges,
      });
    }

    try {
      const response = await robustHttpClient.post(
        'https://scanner.tradingview.com/global/scan',
        scanData,
        { timeout: this.defaultTimeout },
      );

      return {
        market: marketConfig.name,
        totalCount: response.data.totalCount || 0,
        data: this.parseScannedData(response.data.data || [], columns),
        columns,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch market overview for ${market}: ${error.message}`);
    }
  }

  /**
   * Scan stocks with custom filters
   * @param {Object} [options] - Scan options
   * @param {string[]} [options.columns] - Columns to fetch
   * @param {Object[]} [options.filters] - Filters to apply
   * @param {Object} [options.sort] - Sort configuration
   * @param {number} [options.limit] - Maximum results
   * @param {number} [options.offset] - Offset for pagination
   * @returns {Promise<Object>} Scan results
   */
  async scanStocks(options = {}) {
    const columns = options.columns || Object.keys(SCAN_COLUMNS).slice(0, 10);
    const limit = Math.min(options.limit || 100, 350); // TradingView limit
    const offset = options.offset || 0;

    const scanData = {
      filter: options.filters || [],
      options: {
        lang: 'en',
      },
      symbols: {
        query: {
          types: ['stock'],
        },
        tickers: [],
      },
      columns,
      sort: options.sort || {
        sortBy: 'market_cap_basic',
        sortOrder: 'desc',
      },
      range: [offset, offset + limit],
    };

    try {
      const response = await robustHttpClient.post(
        'https://scanner.tradingview.com/global/scan',
        scanData,
        { timeout: this.defaultTimeout },
      );

      return {
        totalCount: response.data.totalCount || 0,
        data: this.parseScannedData(response.data.data || [], columns),
        columns,
        offset,
        limit,
        hasMore: (offset + limit) < (response.data.totalCount || 0),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Stock scan failed: ${error.message}`);
    }
  }

  /**
   * Fetch all stocks with pagination support
   * @param {Object} [options] - Fetch options
   * @param {string[]} [options.columns] - Columns to fetch
   * @param {Object[]} [options.filters] - Filters to apply
   * @param {Object} [options.sort] - Sort configuration
   * @param {number} [options.maxResults] - Maximum total results (default: unlimited)
   * @param {Function} [options.onProgress] - Progress callback
   * @returns {Promise<Object>} All matching stocks
   */
  async fetchAllStocks(options = {}) {
    const maxResults = options.maxResults || Infinity;
    const batchSize = 350; // TradingView max per request
    const allData = [];
    let offset = 0;
    let totalCount = 0;

    try {
      while (allData.length < maxResults) {
        const batchOptions = {
          ...options,
          limit: Math.min(batchSize, maxResults - allData.length),
          offset,
        };

        const result = await this.scanStocks(batchOptions);

        if (offset === 0) {
          totalCount = result.totalCount;
        }

        allData.push(...result.data);
        offset += result.data.length;

        // Call progress callback if provided
        if (options.onProgress) {
          options.onProgress({
            fetched: allData.length,
            total: Math.min(totalCount, maxResults),
            percentage: Math.round((allData.length / Math.min(totalCount, maxResults)) * 100),
          });
        }

        // Check if we have all data or no more data available
        if (!result.hasMore || result.data.length === 0) {
          break;
        }

        // Add a small delay between requests to be respectful
        await this.sleep(100);
      }

      return {
        totalCount,
        fetchedCount: allData.length,
        data: allData,
        columns: options.columns || Object.keys(SCAN_COLUMNS).slice(0, 10),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch all stocks: ${error.message}`);
    }
  }

  /**
   * Parse scanned data into a more readable format
   * @private
   * @param {Array} rawData - Raw data from TradingView
   * @param {string[]} columns - Column names
   * @returns {Array} Parsed data
   */
  parseScannedData(rawData, columns) {
    return rawData.map((item) => {
      const parsed = {
        symbol: item.s,
        description: item.d?.description || '',
      };

      // Map column values
      columns.forEach((column, index) => {
        const value = item.d?.[index];
        const columnName = SCAN_COLUMNS[column] || column;

        if (value !== null && value !== undefined) {
          parsed[column] = value;
          parsed[`${column}_formatted`] = this.formatValue(column, value);
        }
      });

      return parsed;
    });
  }

  /**
   * Format values based on column type
   * @private
   * @param {string} column - Column name
   * @param {*} value - Raw value
   * @returns {string} Formatted value
   */
  formatValue(column, value) {
    if (value === null || value === undefined) return 'N/A';

    // Price formatting
    if (column.includes('close') || column.includes('price') || column.includes('SMA') || column.includes('EMA')) {
      return typeof value === 'number' ? value.toFixed(2) : value.toString();
    }

    // Percentage formatting
    if (column.includes('Perf.') || column.includes('change') || column.includes('yield')) {
      return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : value.toString();
    }

    // Volume formatting
    if (column.includes('volume')) {
      return typeof value === 'number' ? this.formatNumber(value) : value.toString();
    }

    // Market cap formatting
    if (column.includes('market_cap') || column.includes('shares')) {
      return typeof value === 'number' ? this.formatNumber(value) : value.toString();
    }

    return value.toString();
  }

  /**
   * Format large numbers with appropriate suffixes
   * @private
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  static formatNumber(num) {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toString();
  }

  /**
   * Sleep for specified milliseconds
   * @private
   * @param {number} ms - Milliseconds to sleep
   */
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate credentials and connection
   * @returns {Promise<Object>} Validation result
   */
  async validateConnection() {
    try {
      const testResult = await this.scanStocks({
        columns: ['name', 'close'],
        limit: 1,
      });

      return {
        isValid: true,
        message: 'Connection successful',
        sampleData: testResult.data.length > 0 ? testResult.data[0] : null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Connection failed: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Global singleton instance
const marketDataApi = new TradingViewMarketData();

module.exports = {
  TradingViewMarketData,
  marketDataApi,
  MARKETS,
  SCAN_COLUMNS,
  FILTER_OPERATIONS,
};
