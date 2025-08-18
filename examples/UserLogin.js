const TradingView = require('../main');

/**
 * This example demonstrates user login using the streamlined approach
 * It can work with environment variables or command line arguments
 */

async function main() {
  try {
    console.log('🔐 TradingView User Login Example\n');

    // Check if credentials are provided via command line (backward compatibility)
    if (process.argv[2] && process.argv[3]) {
      console.log('📋 Using command line credentials...');
      const username = process.argv[2];
      const password = process.argv[3];
      
      const user = await TradingView.loginUser(username, password, false);
      console.log('✅ Login successful!');
      console.log('👤 User:', user.username);
      console.log('🆔 Session ID:', user.session);
      console.log('🔑 Signature:', user.signature);
      
      // Update session manager with the new session
      TradingView.sessionManager.updateEnvironmentSession(user.session, user.signature);
      
    } else {
      // Use the streamlined session manager
      console.log('📋 Using environment configuration...');
      
      if (!TradingView.config.isAuthenticated) {
        throw new Error('No credentials provided. Please set TRADINGVIEW_USERNAME and TRADINGVIEW_PASSWORD in your .env file or provide them as command line arguments.');
      }
      
      const session = await TradingView.sessionManager.getSession();
      console.log('✅ Session established!');
      console.log('👤 User:', session.username);
      console.log('🆔 Session ID:', session.session);
      console.log('🔑 Signature:', session.signature);
    }

    // Display session information
    console.log('\n📋 Session Information:');
    const sessionInfo = TradingView.sessionManager.getSessionInfo();
    console.log(JSON.stringify(sessionInfo, null, 2));

  } catch (error) {
    console.error('❌ Login failed:', error.message);
    
    if (error.message.includes('No credentials provided')) {
      console.log('\n💡 To use this example:');
      console.log('   1. Set TRADINGVIEW_USERNAME and TRADINGVIEW_PASSWORD in your .env file, OR');
      console.log('   2. Run: node examples/UserLogin.js <username> <password>');
    }
    
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;
