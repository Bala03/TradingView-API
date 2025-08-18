const TradingView = require('../main');

/**
 * Streamlined TradingView API Example
 * This example demonstrates the new streamlined approach with:
 * - Environment-based configuration
 * - Automatic session management
 * - Helper functions for common operations
 * - Better error handling
 */

async function main() {
  try {
    console.log('🚀 Starting Streamlined TradingView API Example\n');

    // 1. Get or create a session automatically
    console.log('📋 Step 1: Authentication & Session Management');
    const session = await TradingView.sessionManager.getSession();
    console.log(`✅ Session established for user: ${session.username}\n`);

    // 2. Create a client
    console.log('📋 Step 2: Creating WebSocket Client');
    const client = new TradingView.Client();
    
    client.onConnected(() => {
      console.log('✅ WebSocket connected');
    });

    client.onDisconnected(() => {
      console.log('❌ WebSocket disconnected');
    });

    client.onError((...err) => {
      console.error('❌ Client error:', ...err);
    });

    // 3. Create a chart using helpers
    console.log('📋 Step 3: Creating Chart with Helpers');
    const chart = TradingView.helpers.createChart(client, {
      market: 'BINANCE:BTCEUR',
      timeframe: '15',
      type: 'Candles'
    });

    // 4. Setup chart handlers using helpers
    TradingView.helpers.setupChartHandlers(chart, {
      onError: true,
      onSymbolLoaded: true,
      onUpdate: true,
      onReady: true
    });

    // 5. Demonstrate dynamic market changes
    console.log('📋 Step 4: Dynamic Market Management');
    
    // Wait for initial load
    await TradingView.helpers.delay(3000);

    // Change to different market
    console.log('\n🔄 Changing to ETH market...');
    chart.setMarket('BINANCE:ETHEUR', { timeframe: '30' });
    
    await TradingView.helpers.delay(3000);

    // Change timeframe
    console.log('\n🔄 Changing to 1-hour timeframe...');
    chart.setSeries('60');
    
    await TradingView.helpers.delay(3000);

    // Change chart type
    console.log('\n🔄 Changing to Heikin Ashi chart...');
    chart.setMarket('BINANCE:ETHEUR', {
      timeframe: '60',
      type: 'HeikinAshi'
    });

    // 6. Demonstrate helper functions
    console.log('\n📋 Step 5: Helper Functions Demo');
    
    // Show available timeframes
    const timeframes = TradingView.helpers.getTimeframes();
    console.log('📊 Available timeframes:', Object.keys(timeframes).join(', '));
    
    // Show available chart types
    const chartTypes = TradingView.helpers.getChartTypes();
    console.log('📈 Available chart types:', Object.keys(chartTypes).join(', '));

    // 7. Cleanup
    console.log('\n📋 Step 6: Cleanup');
    
    await TradingView.helpers.delay(5000);
    
    console.log('🗑️  Closing chart...');
    chart.delete();
    
    await TradingView.helpers.delay(1000);
    
    console.log('🔌 Closing client...');
    client.end();
    
    console.log('\n✅ Example completed successfully!');
    
  } catch (error) {
    console.error('❌ Example failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;