const TradingView = require('../main');

/**
 * Example: Error Handling and Retry Logic
 * This example demonstrates the robust error handling capabilities
 * including automatic retries, rate limiting, and authentication recovery
 */

async function demonstrateErrorHandling() {
  console.log('=== Error Handling and Retry Logic Example ===\n');

  try {
    // 1. Demonstrate automatic retry on network errors
    console.log('1. Testing retry logic with robust HTTP client...\n');
    
    // Create a client with custom retry settings
    const customClient = new TradingView.RobustHttpClient({
      maxRetries: 2,
      baseDelay: 500, // 0.5 seconds
      rateLimit: { requests: 10, window: 10000 } // 10 requests per 10 seconds
    });

    console.log('Making multiple requests to test rate limiting...');
    const promises = [];
    
    // Make several requests rapidly to trigger rate limiting
    for (let i = 0; i < 5; i++) {
      promises.push(
        customClient.get('https://scanner.tradingview.com/global/scan', {
          data: {
            filter: [],
            columns: ['name'],
            range: [0, 1]
          }
        }).then(() => {
          console.log(`Request ${i + 1} completed successfully`);
          return `Request ${i + 1} success`;
        }).catch(error => {
          console.log(`Request ${i + 1} failed: ${error.message}`);
          return `Request ${i + 1} failed`;
        })
      );
    }

    const results = await Promise.all(promises);
    console.log('All requests completed:', results);
    console.log('Custom client stats:', customClient.getStats());
    console.log();

    // 2. Test with invalid credentials to show authentication error handling
    console.log('2. Testing authentication error handling...\n');
    
    // Save current credentials
    const currentCreds = TradingView.globalCredentials.getCredentials();
    
    // Set invalid credentials
    TradingView.globalCredentials.setCredentials('invalid_session', 'invalid_signature');
    
    try {
      await TradingView.globalCredentials.validateCredentials();
      console.log('Validation unexpectedly succeeded');
    } catch (error) {
      console.log('✓ Authentication error properly handled:', error.message);
    }
    
    // Restore credentials if they were valid
    if (currentCreds.sessionId) {
      TradingView.globalCredentials.setCredentials(currentCreds.sessionId, currentCreds.signature);
      console.log('✓ Credentials restored');
    } else {
      TradingView.globalCredentials.clearCredentials();
      console.log('✓ Credentials cleared (was using anonymous mode)');
    }
    console.log();

    // 3. Test graceful handling of malformed responses
    console.log('3. Testing graceful error handling with market data API...\n');
    
    try {
      // Try to fetch data with invalid parameters
      await TradingView.marketDataApi.getMarketOverview('INVALID_MARKET');
    } catch (error) {
      console.log('✓ Invalid market parameter properly handled:', error.message);
    }

    try {
      // Try to scan with invalid filters
      await TradingView.marketDataApi.scanStocks({
        filters: [
          {
            left: 'invalid_column',
            operation: 'invalid_operation',
            right: 'invalid_value'
          }
        ]
      });
    } catch (error) {
      console.log('✓ Invalid filter gracefully handled:', error.message);
    }
    console.log();

    // 4. Demonstrate successful recovery and continued operation
    console.log('4. Demonstrating successful operation after errors...\n');
    
    const validScan = await TradingView.marketDataApi.scanStocks({
      columns: ['name', 'close'],
      limit: 3
    });
    
    console.log('✓ Normal operation resumed successfully');
    console.log(`Fetched ${validScan.data.length} stocks:`, 
                validScan.data.map(s => `${s.symbol}: $${s.close_formatted}`));
    console.log();

    // 5. Show overall HTTP statistics
    console.log('5. Overall HTTP Client Statistics...\n');
    const finalStats = TradingView.robustHttpClient.getStats();
    console.log('Global HTTP client stats:', finalStats);
    
    const successRate = finalStats.totalRequests > 0 
      ? ((finalStats.successfulRequests / finalStats.totalRequests) * 100).toFixed(2)
      : 0;
    
    console.log(`Success rate: ${successRate}%`);
    console.log(`Retry rate: ${finalStats.retriedRequests} retries out of ${finalStats.totalRequests} requests`);
    
    if (finalStats.rateLimitedRequests > 0) {
      console.log(`Rate limited: ${finalStats.rateLimitedRequests} requests`);
    }

    // 6. Error recovery guidance
    console.log('\n6. Error Recovery Guidance...\n');
    console.log('Common error scenarios and recovery:');
    console.log('- Network timeouts: Automatically retried with exponential backoff');
    console.log('- Rate limiting (429): Intelligent delays with progressive backoff');
    console.log('- Authentication errors (401/403): Clear error messages with renewal guidance');
    console.log('- Server errors (5xx): Automatic retry with backoff');
    console.log('- Invalid parameters: Immediate failure with descriptive error messages');
    console.log('- Connection errors: Graceful handling with timeout management');

  } catch (error) {
    console.error('Unexpected error in demo:', error);
  }
}

// Run the example
demonstrateErrorHandling().catch(console.error);