#!/usr/bin/env node

/**
 * Test script for the streamlined TradingView API
 * This script tests the new configuration, session management, and helper functions
 */

const TradingView = require('./main');

async function testStreamlinedSystem() {
  console.log('🧪 Testing Streamlined TradingView API System\n');

  try {
    // Test 1: Configuration System
    console.log('📋 Test 1: Configuration System');
    const config = TradingView.config;
    console.log('✅ Config loaded:', {
      isAuthenticated: config.isAuthenticated,
      hasSession: config.hasSession,
      defaultMarket: config.market.default,
      defaultTimeframe: config.market.timeframe
    });

    // Test 2: Session Manager
    console.log('\n📋 Test 2: Session Manager');
    const sessionManager = TradingView.sessionManager;
    console.log('✅ Session manager loaded');
    
    // Test 3: Helper Functions
    console.log('\n📋 Test 3: Helper Functions');
    const helpers = TradingView.helpers;
    console.log('✅ Helpers loaded');
    
    // Test available timeframes
    const timeframes = helpers.getTimeframes();
    console.log('📊 Available timeframes:', Object.keys(timeframes).length);
    
    // Test available chart types
    const chartTypes = helpers.getChartTypes();
    console.log('📈 Available chart types:', Object.keys(chartTypes).length);

    // Test 4: Market Symbol Validation
    console.log('\n📋 Test 4: Market Symbol Validation');
    const testSymbols = ['BINANCE:BTCEUR', 'COINBASE:ETHUSD', 'INVALID:SYMBOL'];
    testSymbols.forEach(symbol => {
      const isValid = helpers.isValidMarketSymbol(symbol);
      console.log(`  ${symbol}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });

    // Test 5: Configuration Validation
    console.log('\n📋 Test 5: Configuration Validation');
    if (config.isAuthenticated) {
      console.log('✅ Authentication credentials found');
    } else {
      console.log('⚠️  No authentication credentials found');
      console.log('   Please set TRADINGVIEW_USERNAME and TRADINGVIEW_PASSWORD in your .env file');
    }

    // Test 6: Session Status
    console.log('\n📋 Test 6: Session Status');
    const sessionInfo = sessionManager.getSessionInfo();
    console.log('📋 Session info:', sessionInfo);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Set up your .env file with credentials');
    console.log('   2. Run: npm run example');
    console.log('   3. Check the STREAMLINED_README.md for more details');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Make sure all dependencies are installed: npm install');
    console.error('   2. Check if .env file exists and has correct format');
    console.error('   3. Verify TradingView credentials are correct');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  testStreamlinedSystem().catch(console.error);
}

module.exports = testStreamlinedSystem;