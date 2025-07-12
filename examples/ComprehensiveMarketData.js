const TradingView = require('../main');

/**
 * Example: Comprehensive Market Data Fetching
 * This example demonstrates how to fetch market data from different regions
 * with various filters and unlimited pagination support
 */

async function demonstrateMarketDataFetching() {
  console.log('=== Comprehensive Market Data Fetching Example ===\n');

  try {
    // 1. Get market overview for different regions
    console.log('1. Fetching market overviews for different regions...\n');
    
    const markets = ['AMERICA', 'EUROPE', 'ASIA'];
    for (const market of markets) {
      console.log(`--- ${market} Market Overview ---`);
      
      const overview = await TradingView.marketDataApi.getMarketOverview(market, {
        columns: ['name', 'close', 'change', 'volume', 'market_cap_basic'],
        limit: 5
      });
      
      console.log(`Total stocks in ${market}:`, overview.totalCount);
      console.log('Top 5 stocks:');
      overview.data.forEach((stock, index) => {
        console.log(`${index + 1}. ${stock.symbol} (${stock.name}): $${stock.close_formatted} (${stock.change_formatted})`);
      });
      console.log();
    }

    // 2. Custom stock scanning with filters
    console.log('2. Custom stock scanning with filters...\n');
    
    const filteredScan = await TradingView.marketDataApi.scanStocks({
      columns: ['name', 'close', 'market_cap_basic', 'volume', 'RSI', 'price_earnings_ttm'],
      filters: [
        {
          left: 'market_cap_basic',
          operation: 'greater',
          right: 1000000000 // Market cap > 1B
        },
        {
          left: 'RSI',
          operation: 'eless', 
          right: 70 // RSI <= 70
        },
        {
          left: 'RSI',
          operation: 'egreater',
          right: 30 // RSI >= 30
        }
      ],
      sort: {
        sortBy: 'volume',
        sortOrder: 'desc'
      },
      limit: 10
    });

    console.log('Stocks with market cap > 1B and RSI between 30-70:');
    console.log(`Found ${filteredScan.totalCount} matching stocks, showing top 10:`);
    filteredScan.data.forEach((stock, index) => {
      console.log(`${index + 1}. ${stock.symbol}: $${stock.close_formatted}, MC: ${stock.market_cap_basic_formatted}, RSI: ${stock.RSI}, P/E: ${stock.price_earnings_ttm}`);
    });
    console.log();

    // 3. Fetch all available data with pagination (limited example)
    console.log('3. Demonstrating unlimited data fetching with pagination...\n');
    
    const progressCallback = (progress) => {
      process.stdout.write(`\rProgress: ${progress.percentage}% (${progress.fetched}/${progress.total})`);
    };

    console.log('Fetching all high-volume stocks (limited to 100 for demo)...');
    const allHighVolumeStocks = await TradingView.marketDataApi.fetchAllStocks({
      columns: ['name', 'close', 'volume', 'change'],
      filters: [
        {
          left: 'volume',
          operation: 'greater',
          right: 1000000 // Volume > 1M
        }
      ],
      sort: {
        sortBy: 'volume',
        sortOrder: 'desc'
      },
      maxResults: 100, // Limit for demo
      onProgress: progressCallback
    });

    console.log(`\nFetched ${allHighVolumeStocks.fetchedCount} out of ${allHighVolumeStocks.totalCount} high-volume stocks`);
    console.log('Top 10 by volume:');
    allHighVolumeStocks.data.slice(0, 10).forEach((stock, index) => {
      console.log(`${index + 1}. ${stock.symbol}: Volume ${stock.volume_formatted}, Price: $${stock.close_formatted}`);
    });
    console.log();

    // 4. Show available markets and columns
    console.log('4. Available markets and data columns...\n');
    
    const availableMarkets = TradingView.marketDataApi.getAvailableMarkets();
    console.log('Available markets:');
    Object.entries(availableMarkets).forEach(([key, market]) => {
      console.log(`- ${key}: ${market.name} (${market.currency}, exchanges: ${market.exchanges.join(', ')})`);
    });
    console.log();

    const availableColumns = TradingView.marketDataApi.getAvailableColumns();
    console.log('Available data columns (first 15):');
    Object.entries(availableColumns).slice(0, 15).forEach(([key, description]) => {
      console.log(`- ${key}: ${description}`);
    });
    console.log('... and more');

    // 5. HTTP Client Statistics
    console.log('\n5. HTTP Client Statistics...\n');
    const stats = TradingView.robustHttpClient.getStats();
    console.log('Request statistics:', stats);

  } catch (error) {
    console.error('Error fetching market data:', error.message);
  }
}

// Run the example
demonstrateMarketDataFetching().catch(console.error);