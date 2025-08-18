# TradingView API - Streamlined Version

This is a streamlined and optimized version of the TradingView API that provides better configuration management, session handling, and developer experience.

## 🚀 What's New

### ✨ Key Improvements
- **Environment-based Configuration**: Use `.env` files for secure credential management
- **Automatic Session Management**: Sessions are automatically created and reused
- **Helper Functions**: Common operations are simplified with utility functions
- **Better Error Handling**: Consistent error handling across all examples
- **Configuration Validation**: Automatic validation of required settings
- **Session Persistence**: Optional session storage for faster subsequent runs

### 🔧 New Features
- **Config Manager**: Centralized configuration management
- **Session Manager**: Automatic authentication and session handling
- **Helper Utilities**: Common chart operations and utilities
- **Environment Templates**: `.env.example` file for easy setup

## 📋 Quick Start

### 1. Installation
```bash
npm install @mathieuc/tradingview
```

### 2. Environment Setup
Copy the `.env.example` file to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your TradingView credentials:
```env
TRADINGVIEW_USERNAME=your_username_or_email
TRADINGVIEW_PASSWORD=your_password
```

### 3. Basic Usage
```javascript
const TradingView = require('@mathieuc/tradingview');

async function example() {
  // Get or create a session automatically
  const session = await TradingView.sessionManager.getSession();
  
  // Create a client
  const client = new TradingView.Client();
  
  // Create a chart using helpers
  const chart = TradingView.helpers.createChart(client, {
    market: 'BINANCE:BTCEUR',
    timeframe: '15'
  });
  
  // Setup handlers
  TradingView.helpers.setupChartHandlers(chart);
}
```

## 🏗️ Architecture

### Configuration System
```javascript
const config = TradingView.config;

// Access configuration
console.log(config.auth.username);        // Username from environment
console.log(config.market.default);       // Default market
console.log(config.connection.timeout);   // Connection timeout
```

### Session Management
```javascript
const sessionManager = TradingView.sessionManager;

// Get or create session
const session = await sessionManager.getSession();

// Check session status
if (sessionManager.isSessionValid()) {
  console.log('Session is active');
}

// Refresh session
await sessionManager.refreshSession();
```

### Helper Functions
```javascript
const helpers = TradingView.helpers;

// Create chart with defaults
const chart = helpers.createChart(client, options);

// Setup common handlers
helpers.setupChartHandlers(chart);

// Utility functions
await helpers.delay(1000);
await helpers.retry(asyncFunction, 3);
```

## 📚 Examples

### Streamlined Example
```bash
node examples/StreamlinedExample.js
```

### Updated Simple Chart
```bash
node examples/SimpleChart.js
```

### User Login
```bash
# Using environment variables
node examples/UserLogin.js

# Using command line arguments
node examples/UserLogin.js username password
```

## ⚙️ Configuration Options

### Authentication
| Variable | Description | Default |
|----------|-------------|---------|
| `TRADINGVIEW_USERNAME` | Your TradingView username/email | Required |
| `TRADINGVIEW_PASSWORD` | Your TradingView password | Required |
| `TRADINGVIEW_SESSION_ID` | Stored session ID | Auto-generated |
| `TRADINGVIEW_SIGNATURE` | Stored session signature | Auto-generated |

### Market Settings
| Variable | Description | Default |
|----------|-------------|---------|
| `DEFAULT_MARKET` | Default market symbol | `BINANCE:BTCEUR` |
| `DEFAULT_TIMEFRAME` | Default timeframe | `D` |
| `DEFAULT_CHART_TYPE` | Default chart type | `HeikinAshi` |

### Connection Settings
| Variable | Description | Default |
|----------|-------------|---------|
| `WEBSOCKET_TIMEOUT` | WebSocket timeout (ms) | `30000` |
| `REQUEST_TIMEOUT` | HTTP request timeout (ms) | `10000` |
| `MAX_RETRIES` | Maximum retry attempts | `3` |

### Logging
| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | `info` |
| `ENABLE_DEBUG` | Enable debug mode | `false` |

## 🔄 Session Management

### Automatic Session Handling
The session manager automatically:
- Checks for existing valid sessions
- Authenticates with TradingView when needed
- Stores session credentials for reuse
- Handles session expiration and refresh

### Session Persistence
Sessions are automatically stored in environment variables:
```javascript
// Session is automatically stored
const session = await sessionManager.getSession();

// Can be reused in subsequent runs
process.env.TRADINGVIEW_SESSION_ID;    // Session ID
process.env.TRADINGVIEW_SIGNATURE;     // Session signature
```

## 🛠️ Helper Functions

### Chart Creation
```javascript
// Create chart with defaults
const chart = helpers.createChart(client);

// Create chart with custom options
const chart = helpers.createChart(client, {
  market: 'BINANCE:ETHEUR',
  timeframe: '30',
  type: 'Candles'
});
```

### Event Handlers
```javascript
// Setup all handlers
helpers.setupChartHandlers(chart);

// Setup specific handlers
helpers.setupChartHandlers(chart, {
  onError: true,
  onSymbolLoaded: true,
  onUpdate: false,
  onReady: true
});
```

### Utility Functions
```javascript
// Delay execution
await helpers.delay(5000);

// Retry with exponential backoff
const result = await helpers.retry(asyncFunction, 3, 1000);

// Format market data
const formatted = helpers.formatMarketData(period, 'USD');

// Validate market symbol
if (helpers.isValidMarketSymbol('BINANCE:BTCEUR')) {
  // Valid symbol
}
```

## 🚨 Error Handling

### Configuration Errors
```javascript
try {
  const session = await sessionManager.getSession();
} catch (error) {
  if (error.message.includes('No authentication credentials')) {
    console.log('Please check your .env file');
  }
}
```

### Session Errors
```javascript
try {
  const session = await sessionManager.getSession();
} catch (error) {
  if (error.message.includes('Wrong or expired session')) {
    console.log('Session expired, attempting to refresh...');
    await sessionManager.refreshSession();
  }
}
```

## 🔒 Security Best Practices

### Environment Variables
- Never commit `.env` files to version control
- Use strong, unique passwords
- Rotate credentials regularly
- Use environment-specific configuration files

### Session Security
- Sessions are automatically managed
- Credentials are stored in memory only
- Automatic session refresh on expiration
- Secure cookie handling

## 📊 Performance Optimizations

### Session Reuse
- Sessions are cached and reused
- Automatic validation of session health
- Lazy authentication (only when needed)

### Connection Management
- Configurable timeouts
- Automatic retry logic
- Connection pooling
- Graceful error handling

## 🧪 Testing

### Run Examples
```bash
# Run all examples
npm run example

# Run specific example
node examples/StreamlinedExample.js

# Run with nodemon for development
npm run example:dev
```

### Configuration Testing
```bash
# Test configuration
node -e "console.log(require('./src/config').all)"

# Test session manager
node -e "require('./src/sessionManager').getSession().then(console.log)"
```

## 🔧 Troubleshooting

### Common Issues

#### Configuration Not Found
```bash
# Check if .env file exists
ls -la .env

# Verify environment variables
echo $TRADINGVIEW_USERNAME
```

#### Authentication Failed
```bash
# Check credentials
node examples/UserLogin.js

# Verify TradingView account status
# Check if 2FA is enabled
```

#### Session Expired
```bash
# Clear session and re-authenticate
node -e "require('./src/sessionManager').clearSession()"
```

### Debug Mode
Enable debug mode in your `.env` file:
```env
ENABLE_DEBUG=true
LOG_LEVEL=debug
```

## 📈 Migration Guide

### From Old Examples
**Before:**
```javascript
const client = new TradingView.Client();
const chart = new client.Session.Chart();
chart.setMarket('BINANCE:BTCEUR', { timeframe: 'D' });
```

**After:**
```javascript
const session = await TradingView.sessionManager.getSession();
const client = new TradingView.Client();
const chart = TradingView.helpers.createChart(client, {
  market: 'BINANCE:BTCEUR',
  timeframe: 'D'
});
```

### Environment Variables
**Before:**
```javascript
const username = process.argv[2];
const password = process.argv[3];
```

**After:**
```javascript
// Automatically handled by session manager
const session = await TradingView.sessionManager.getSession();
```

## 🤝 Contributing

### Development Setup
```bash
git clone <repository>
cd TradingView-API
npm install
cp .env.example .env
# Edit .env with your credentials
npm run example:dev
```

### Code Style
- Use ES6+ features
- Follow existing naming conventions
- Add JSDoc comments for new functions
- Include error handling
- Write tests for new features

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Mathieu2301/TradingView-API/issues)
- **Telegram**: [t.me/tradingview_api](https://t.me/tradingview_api)
- **Documentation**: Check examples and this README

---

**Happy Trading! 📈**