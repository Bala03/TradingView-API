# TradingView API [![GitHub stars](https://img.shields.io/github/stars/Mathieu2301/TradingView-API.svg?style=social&label=Star&maxAge=2592000)](https://GitHub.com/Mathieu2301/TradingView-API/stargazers/)

[![Tests](https://github.com/Mathieu2301/TradingView-API/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/Mathieu2301/TradingView-API/actions/workflows/tests.yml)
[![CodeFactor](https://www.codefactor.io/repository/github/mathieu2301/tradingview-api/badge/main)](https://www.codefactor.io/repository/github/mathieu2301/tradingview-api/overview/main)
[![GitHub latest commit](https://img.shields.io/github/last-commit/Mathieu2301/TradingView-API)](https://GitHub.com/Mathieu2301/TradingView-API/commit/)
[![Npm package yearly downloads](https://badgen.net/npm/dt/@mathieuc/tradingview)](https://npmjs.com/@mathieuc/tradingview)
[![Minimum node.js version](https://badgen.net/npm/node/@mathieuc/tradingview)](https://npmjs.com/@mathieuc/tradingview)
[![Npm package version](https://badgen.net/npm/v/@mathieuc/tradingview)](https://npmjs.com/package/@mathieuc/tradingview)

Get realtime market prices and indicator values from Tradingview !

## 🟢 Need help with your project?

🚀 Click [here](https://forms.gle/qPp5RKo8L55C5oJE7) for personalized assistance on your project.

## 🔵 Telegram group

👉 To get help, exchange tips, find collaborators, developers, missions, etc...

Join the Telegram group of the TradingView-API Community: [t.me/tradingview_api](https://t.me/tradingview_api)

## Features

- [x] Premium features
- [x] Automatically backtest many strategies and try many settings in a very little time
- [x] Get drawings you made on your chart
- [x] Works with invite-only indicators
- [x] Unlimited simultaneous indicators
- [x] Realtime
- [x] Get TradingView's technical analysis
- [x] Replay mode + Fake Replay mode (for free plan)
- [x] Get values from a specific date range
- [ ] TradingView socket server emulation
- [ ] Interract with public chats
- [ ] Get Screener top values
- [ ] Get Hotlists
- [ ] Get Calendar
- IF YOU WANT A FEATURE, ASK ME !

## Auto-Reconnect Feature

The client now includes automatic WebSocket reconnection with exponential backoff:

```javascript
const client = new TradingView.Client({
  autoReconnect: true, // Enable auto-reconnect (default: true)
  maxRetries: 10, // Maximum reconnection attempts (default: 10)
  initialDelay: 1000, // Initial delay in ms (default: 1000)
  maxDelay: 30000, // Maximum delay in ms (default: 30000)
  backoffMultiplier: 2, // Backoff multiplier (default: 2)
});

// Listen to reconnection events
client.onConnected(() => {
  console.log('Connected to TradingView');
});

client.onDisconnected(() => {
  console.log('Disconnected from TradingView');
});
```

## Possibilities

- Trading bot
- Discord alerts
- Hard backtest
- Machine Learning based indicator
- Free replay mode for all timeframes

---

## Installation

Stable version:

```ruby
npm i @mathieuc/tradingview
```

Last version:

```ruby
npm i github:Mathieu2301/TradingView-API
```

## Available Scripts

```bash
# Install dependencies
npm install

# Run linting (auto-fixes issues)
npm run lint

# Check linting without fixing
npm run lint:check

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run tests in CI mode
npm run test:ci

# Run example (requires .env file with credentials)
npm run example

# Run streamlined example in development mode
npm run example:dev

# Setup environment file
npm run setup
```

## Testing

The project includes comprehensive unit tests for core components:

```bash
# Run all tests
npm test

# Run only unit tests (helpers and utilities)
npm run test:unit

# Run tests in CI mode with verbose output
npm run test:ci
```

Test coverage includes:

- Utility functions (session ID generation, authentication cookies)
- Helper functions (chart creation, market data formatting, retry logic)
- Auto-reconnect functionality with WebSocket mocking

## Examples

You can find all the examples and snippets in `./examples` folder.

## Before opening an issue

Please look at examples and previously resolved issues before opening a new one. I can't help everyone (especially for questions that are not library related but JavaScript related). Thank you for your understanding.

---

## Problems

If you have errors in console or unwanted behavior,
please create an issue [here](https://github.com/Mathieu2301/Tradingview-API/issues).
