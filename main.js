const miscRequests = require('./src/miscRequests');
const Client = require('./src/client');
const BuiltInIndicator = require('./src/classes/BuiltInIndicator');
const PineIndicator = require('./src/classes/PineIndicator');
const PinePermManager = require('./src/classes/PinePermManager');

// Enhanced TradingView API components
const { TradingViewApiCredentials, globalCredentials } = require('./src/TradingViewApi.credentials');
const { RobustHttpClient, robustHttpClient } = require('./src/robustHttpClient');
const { TradingViewMarketData, marketDataApi, MARKETS, SCAN_COLUMNS, FILTER_OPERATIONS } = require('./src/marketDataApi');

module.exports = { ...miscRequests };
module.exports.Client = Client;
module.exports.BuiltInIndicator = BuiltInIndicator;
module.exports.PineIndicator = PineIndicator;
module.exports.PinePermManager = PinePermManager;

// Enhanced API exports
module.exports.TradingViewApiCredentials = TradingViewApiCredentials;
module.exports.globalCredentials = globalCredentials;
module.exports.RobustHttpClient = RobustHttpClient;
module.exports.robustHttpClient = robustHttpClient;
module.exports.TradingViewMarketData = TradingViewMarketData;
module.exports.marketDataApi = marketDataApi;
module.exports.MARKETS = MARKETS;
module.exports.SCAN_COLUMNS = SCAN_COLUMNS;
module.exports.FILTER_OPERATIONS = FILTER_OPERATIONS;
