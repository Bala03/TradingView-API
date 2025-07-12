const TradingView = require('../main');

/**
 * Example: Global Session Management
 * This example demonstrates how to set up global credentials 
 * and validate them for use across all operations
 */

async function demonstrateGlobalSessionManagement() {
  console.log('=== Global Session Management Example ===\n');

  // Get session ID and signature from environment variables or command line
  const sessionId = process.env.TV_SESSION_ID || process.argv[2];
  const signature = process.env.TV_SESSION_SIGNATURE || process.argv[3];

  // Set global credentials
  if (sessionId) {
    console.log('Setting global credentials...');
    TradingView.globalCredentials.setCredentials(sessionId, signature);
    
    // Check credentials status
    const status = TradingView.globalCredentials.getStatus();
    console.log('Credentials status:', status);
    
    // Validate credentials
    console.log('\nValidating credentials...');
    const isValid = await TradingView.globalCredentials.validateCredentials();
    console.log('Credentials valid:', isValid);
    
    if (isValid) {
      const credentials = TradingView.globalCredentials.getCredentials();
      console.log('User info:', credentials.user);
    }
  } else {
    console.log('No credentials provided. Using anonymous mode.');
    console.log('To use authenticated features, set TV_SESSION_ID environment variable');
    console.log('or pass session ID as first argument: node GlobalSessionManagement.js <session_id> [signature]');
  }

  // Test connection
  console.log('\n=== Testing Connection ===');
  const connectionTest = await TradingView.marketDataApi.validateConnection();
  console.log('Connection test result:', connectionTest);

  // Get HTTP client statistics
  console.log('\n=== HTTP Client Statistics ===');
  const stats = TradingView.robustHttpClient.getStats();
  console.log('Request statistics:', stats);
}

// Run the example
demonstrateGlobalSessionManagement().catch(console.error);