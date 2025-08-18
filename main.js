const miscRequests = require('./src/miscRequests');
const Client = require('./src/client');
const BuiltInIndicator = require('./src/classes/BuiltInIndicator');
const PineIndicator = require('./src/classes/PineIndicator');
const PinePermManager = require('./src/classes/PinePermManager');

// New streamlined modules
const config = require('./src/config');
const sessionManager = require('./src/sessionManager');
const helpers = require('./src/helpers');

module.exports = { 
  ...miscRequests,
  config,
  sessionManager,
  helpers
};
module.exports.Client = Client;
module.exports.BuiltInIndicator = BuiltInIndicator;
module.exports.PineIndicator = PineIndicator;
module.exports.PinePermManager = PinePermManager;
