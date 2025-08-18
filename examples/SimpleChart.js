const TradingView = require('../main');

/**
 * This example creates a BTCEUR daily chart using the streamlined approach
 * It demonstrates the new configuration system and helper functions
 */

async function main() {
  try {
    // Get or create a session automatically
    const session = await TradingView.sessionManager.getSession();
    console.log(`✅ Authenticated as: ${session.username}`);

    // Create a websocket client
    const client = new TradingView.Client();

    // Create a chart using helpers with default configuration
    const chart = TradingView.helpers.createChart(client, {
      market: 'BINANCE:BTCEUR',
      timeframe: 'D'
    });

    // Setup chart handlers using helpers
    TradingView.helpers.setupChartHandlers(chart, {
      onError: true,
      onSymbolLoaded: true,
      onUpdate: true,
      onReady: false
    });

    // Wait 5 seconds and set the market to BINANCE:ETHEUR
    await TradingView.helpers.delay(5000);
    console.log('\n🔄 Setting market to BINANCE:ETHEUR...');
    chart.setMarket('BINANCE:ETHEUR', {
      timeframe: 'D',
    });

    // Wait 10 seconds and set the timeframe to 15 minutes
    await TradingView.helpers.delay(5000);
    console.log('\n🔄 Setting timeframe to 15 minutes...');
    chart.setSeries('15');

    // Wait 15 seconds and set the chart type to "Heikin Ashi"
    await TradingView.helpers.delay(5000);
    console.log('\n🔄 Setting the chart type to "Heikin Ashi"...');
    chart.setMarket('BINANCE:ETHEUR', {
      timeframe: 'D',
      type: 'HeikinAshi',
    });

    // Wait 20 seconds and close the chart
    await TradingView.helpers.delay(5000);
    console.log('\n🗑️ Closing the chart...');
    chart.delete();

    // Wait 25 seconds and close the client
    await TradingView.helpers.delay(5000);
    console.log('\n🔌 Closing the client...');
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

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;
