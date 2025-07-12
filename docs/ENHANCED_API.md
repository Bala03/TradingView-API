# Enhanced TradingView API Integration

This document describes the enhanced TradingView API integration that provides robust, production-ready features for comprehensive market data access.

## 🚀 New Features

### ✅ Global Session Management

**Centralized Credentials Management**
- Session ID and signature managed globally across all operations
- Automatic authentication headers for every request
- Built-in session validation and health checks
- No manual credential setup required for each operation

```javascript
const TradingView = require('@mathieuc/tradingview');

// Set global credentials once
TradingView.globalCredentials.setCredentials('your_session_id', 'your_signature');

// Validate credentials
const isValid = await TradingView.globalCredentials.validateCredentials();
console.log('Credentials valid:', isValid);

// Get credential status
const status = TradingView.globalCredentials.getStatus();
console.log('Status:', status);
```

### ✅ Robust Error Handling & Zero-Error Fetching

**Automatic Retry Logic**
- 3 attempts with exponential backoff (1s, 2s, 4s delays)
- Rate limit management with intelligent delays for 429 errors
- Progressive backoff for server rate limits (5s, 10s, 20s)
- Authentication recovery with clear error messages
- Server error handling for temporary 5xx issues
- Network resilience with graceful timeout management

```javascript
// The robust HTTP client is used automatically
// All requests include retry logic and error handling
const data = await TradingView.marketDataApi.scanStocks({
  columns: ['name', 'close', 'volume'],
  limit: 100
});

// Get request statistics
const stats = TradingView.robustHttpClient.getStats();
console.log('Success rate:', (stats.successfulRequests / stats.totalRequests * 100).toFixed(2) + '%');
```

### ✅ Comprehensive Market Data Access

**Multiple Markets Support**
- America (NASDAQ, NYSE, AMEX, OTC, CBOE)
- Europe (LSE, EURONEXT, XETRA, SIX, BME)
- Asia (TSE, HKEX, SGX, KRX, TWSE)
- Australia (ASX, NSXA)
- Canada (TSX, TSXV, CSE)
- India (BSE, NSE)

**Rich Data Columns (15+ available)**
- Basic: Price, Volume, Change, Performance metrics
- Financial: Market Cap, P/E, P/B, P/S, EV/EBITDA, Dividend Yield
- Technical: RSI, MACD, Stochastic, ADX, Williams %R, CCI, ATR
- Moving Averages: SMA/EMA (10, 20, 50, 200)
- Bollinger Bands: Upper/Lower bands
- Recommendations: Technical analysis recommendations

**Advanced Filtering (5 operation types)**
- `greater` (>), `less` (<), `egreater` (>=), `eless` (<=)
- `equal` (=), `not_equal` (!=)
- `in_range`, `not_in_range`, `match`

```javascript
// Get market overview
const overview = await TradingView.marketDataApi.getMarketOverview('AMERICA', {
  columns: ['name', 'close', 'change', 'volume', 'market_cap_basic'],
  limit: 50
});

// Custom stock scanning with filters
const filteredStocks = await TradingView.marketDataApi.scanStocks({
  columns: ['name', 'close', 'RSI', 'price_earnings_ttm'],
  filters: [
    {
      left: 'market_cap_basic',
      operation: 'greater',
      right: 1000000000 // Market cap > 1B
    },
    {
      left: 'RSI',
      operation: 'in_range',
      right: [30, 70] // RSI between 30-70
    }
  ],
  sort: {
    sortBy: 'volume',
    sortOrder: 'desc'
  },
  limit: 100
});
```

**Unlimited Data with Pagination**
```javascript
// Fetch all matching stocks with pagination support
const allStocks = await TradingView.marketDataApi.fetchAllStocks({
  columns: ['name', 'close', 'volume', 'market_cap_basic'],
  filters: [
    {
      left: 'volume',
      operation: 'greater',
      right: 1000000 // Volume > 1M
    }
  ],
  maxResults: 1000, // Optional limit
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percentage}% (${progress.fetched}/${progress.total})`);
  }
});

console.log(`Fetched ${allStocks.fetchedCount} stocks out of ${allStocks.totalCount} total`);
```

## 📚 API Reference

### TradingViewApiCredentials

Global credentials management for authentication.

```javascript
const credentials = TradingView.globalCredentials;

// Set credentials
credentials.setCredentials(sessionId, signature);

// Validate credentials
const isValid = await credentials.validateCredentials();

// Get authentication headers
const headers = credentials.getAuthHeaders();

// Check status
const status = credentials.getStatus();

// Clear credentials
credentials.clearCredentials();
```

### RobustHttpClient

HTTP client with retry logic and error handling.

```javascript
const client = TradingView.robustHttpClient;

// Make requests (with automatic retry)
const response = await client.get('https://api.example.com/data');
const postResponse = await client.post('https://api.example.com/data', payload);

// Get statistics
const stats = client.getStats();
console.log('Total requests:', stats.totalRequests);
console.log('Success rate:', stats.successfulRequests / stats.totalRequests);

// Reset statistics
client.resetStats();
```

### TradingViewMarketData

Comprehensive market data fetching with advanced features.

```javascript
const marketData = TradingView.marketDataApi;

// Get available markets
const markets = marketData.getAvailableMarkets();

// Get available data columns
const columns = marketData.getAvailableColumns();

// Get filter operations
const operations = marketData.getFilterOperations();

// Market overview
const overview = await marketData.getMarketOverview(market, options);

// Stock scanning
const results = await marketData.scanStocks(options);

// Fetch all stocks with pagination
const allStocks = await marketData.fetchAllStocks(options);

// Validate connection
const validation = await marketData.validateConnection();
```

## 🛠️ Configuration Options

### RobustHttpClient Options

```javascript
const client = new TradingView.RobustHttpClient({
  maxRetries: 3,           // Maximum retry attempts
  baseDelay: 1000,         // Base delay for exponential backoff (ms)
  maxDelay: 10000,         // Maximum delay between retries (ms)
  rateLimit: {             // Client-side rate limiting
    requests: 100,         // Max requests per window
    window: 60000          // Time window in milliseconds
  }
});
```

### Market Data Scan Options

```javascript
const options = {
  columns: ['name', 'close', 'volume'],  // Data columns to fetch
  filters: [                             // Filter conditions
    {
      left: 'market_cap_basic',           // Column to filter
      operation: 'greater',               // Filter operation
      right: 1000000000                   // Filter value
    }
  ],
  sort: {                                // Sort configuration
    sortBy: 'volume',                     // Column to sort by
    sortOrder: 'desc'                     // Sort direction (asc/desc)
  },
  limit: 100,                            // Maximum results per request
  offset: 0,                             // Pagination offset
  maxResults: 1000,                      // Total result limit (for fetchAllStocks)
  onProgress: (progress) => { ... }       // Progress callback
};
```

## 🔧 Error Handling

The enhanced API provides comprehensive error handling:

```javascript
try {
  const data = await TradingView.marketDataApi.scanStocks(options);
} catch (error) {
  if (error.message.includes('Authentication failed')) {
    console.log('Please check your session ID and signature');
    // Handle authentication error
  } else if (error.message.includes('Rate limited')) {
    console.log('Rate limited - the client will automatically retry');
    // Rate limiting is handled automatically
  } else {
    console.log('Other error:', error.message);
    // Handle other errors
  }
}
```

## 📊 Request Statistics

Monitor API usage and performance:

```javascript
const stats = TradingView.robustHttpClient.getStats();

console.log('Request Statistics:');
console.log('- Total requests:', stats.totalRequests);
console.log('- Successful requests:', stats.successfulRequests);
console.log('- Failed requests:', stats.failedRequests);
console.log('- Retried requests:', stats.retriedRequests);
console.log('- Rate limited requests:', stats.rateLimitedRequests);

const successRate = (stats.successfulRequests / stats.totalRequests * 100).toFixed(2);
console.log('- Success rate:', successRate + '%');
```

## 🎯 Use Cases

### Trading Bot Integration
```javascript
// Set up credentials once
TradingView.globalCredentials.setCredentials(sessionId, signature);

// Monitor high-volume stocks
const highVolumeStocks = await TradingView.marketDataApi.scanStocks({
  columns: ['name', 'close', 'volume', 'change', 'RSI'],
  filters: [
    { left: 'volume', operation: 'greater', right: 5000000 },
    { left: 'RSI', operation: 'less', right: 30 } // Oversold
  ],
  sort: { sortBy: 'volume', sortOrder: 'desc' }
});

// Process trading signals
highVolumeStocks.data.forEach(stock => {
  console.log(`${stock.symbol}: RSI ${stock.RSI} - Potential buy signal`);
});
```

### Market Analysis Dashboard
```javascript
// Get overview of multiple markets
const markets = ['AMERICA', 'EUROPE', 'ASIA'];
const marketData = {};

for (const market of markets) {
  marketData[market] = await TradingView.marketDataApi.getMarketOverview(market, {
    columns: ['name', 'close', 'change', 'volume'],
    limit: 10
  });
}

// Display top performers
Object.entries(marketData).forEach(([market, data]) => {
  console.log(`\n${market} Top Performers:`);
  data.data.slice(0, 5).forEach(stock => {
    console.log(`${stock.symbol}: ${stock.change_formatted} change`);
  });
});
```

This enhanced API provides a robust, production-ready foundation for TradingView integrations with comprehensive error handling, unlimited data access, and global session management.