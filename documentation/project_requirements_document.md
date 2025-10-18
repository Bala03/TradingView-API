# Project Requirements Document (PRD)

## 1. Project Overview

The **TradingView-API** is a JavaScript (Node.js) library designed to give developers programmatic access to TradingView’s powerful charting and market data platform. Instead of manually clicking through the TradingView UI, developers can fetch real-time price updates, manage chart sessions, retrieve technical indicators, and automate trading or alerting workflows directly from their code. This solves the pain point of manual interactions and allows integration of TradingView’s data and features into custom trading bots, analysis tools, or dashboards.

We’re building this library to streamline and standardize how developers interact with TradingView’s services. Key objectives include: 1) Providing reliable, low-latency data streaming via WebSockets; 2) Exposing both built-in and Pine Script indicators; 3) Enabling full lifecycle management of charts and scripts; 4) Ensuring a well-tested, modular codebase that’s easy to extend. We’ll consider the project successful if developers can install the package, configure their API credentials, and run automated test examples to fetch live data, configure a chart, and subscribe to indicator updates—all without ambiguity.

---

## 2. In-Scope vs. Out-of-Scope

**In-Scope (v1.0)**
- Real-time market data subscriptions (price, bid/ask, volume) via WebSockets.  
- Access to built-in TradingView indicators (Moving Averages, RSI, MACD, etc.).  
- Pine Script indicator management (load custom scripts, set inputs, check permissions).  
- Chart session control (create sessions, switch symbols, timeframes, chart types).  
- Event-driven API (onUpdate, onError, onSymbolLoaded callbacks).  
- Basic authentication/session management using API tokens or credentials.  
- Configuration via `.env` and `dotenv` for sensitive info.  
- HTTP requests support with Axios for non-streaming endpoints.  
- Sample code in `examples/` and test suites with Vitest.  
- Utility helpers for common tasks (chart creation, event wrapping).

**Out-of-Scope (v1.0)**
- Official support for backtesting or order execution on broker platforms.  
- Full historical data downloads with pagination or backfill logic.  
- Graphical UI components or visualization libraries.  
- TypeScript definitions (no static types in initial release).  
- Rate limiting middleware or throttling built into the library (to be added later).  
- Multi-user or multi-tenant session isolation.  
- Cloud-hosted deployment or SaaS offering—library is client-side only.

---

## 3. User Flow

1. A developer installs the package from npm (`npm install tradingview-api`) and creates a `.env` file based on the provided `.env.example`, filling in their TradingView API token or login credentials. They import the client library in their Node.js script, call an asynchronous `initialize()` method to authenticate, and listen for an `onReady` event.

2. Once initialized, the developer opens a chart session by specifying a ticker symbol (like `AAPL`), a timeframe (e.g., `1m`, `1h`), and a chart type (`candles`, `bars`). They can then subscribe to live price updates (`quoteSession.subscribe(symbol)`), attach indicators (`chartSession.addIndicator('RSI', { length: 14 })`), and handle events like `onUpdate` to receive data payloads. Based on those updates, they trigger custom callbacks—such as sending alerts, logging data, or feeding signals into a trading engine.

---

## 4. Core Features

- **Authentication & Session Management**  
  • login/authenticate with TradingView credentials or tokens  
  • maintain session state and reconnect logic

- **Real-Time Market Data**  
  • subscribe/unsubscribe to quotes for multiple symbols  
  • receive price, bid, ask, and volume updates over WebSockets

- **Chart Session Control**  
  • create, configure, and close chart sessions  
  • set symbol, timeframe, and chart type dynamically  
  • attach/detach studies or drawings

- **Indicator Integration**  
  • load built-in indicators (Moving Average, RSI, etc.)  
  • load and manage custom Pine Script indicators  
  • configure indicator inputs and handle permission checks

- **Event-Driven API**  
  • standardized callbacks: onSymbolLoaded, onUpdate, onError  
  • error and reconnection events for resiliency

- **HTTP Request Support**  
  • Axios-based endpoints for non-streaming data (e.g., symbol search)  

- **Environment Configuration**  
  • `.env` loading via `dotenv`  
  • sample `.env.example` for easy setup

- **Testing & Examples**  
  • unit and integration tests in Vitest  
  • concrete use-case examples in `examples/` folder

---

## 5. Tech Stack & Tools

- **Language & Runtime:** JavaScript (Node.js v14+)
- **WebSocket Library:** Native `ws` or similar for real-time streaming
- **HTTP Client:** Axios for REST calls
- **Environment Management:** dotenv to load `.env` variables
- **Testing Framework:** Vitest for unit and integration tests
- **Documentation:** JSDoc comments and `docs/DOCS.md`
- **Package Management:** npm or yarn
- **Build/Transpile:** Optional use of Babel (if needed)
- **IDE Integrations:** ESLint & Prettier for code style (to be added)

---

## 6. Non-Functional Requirements

- **Performance:**  
  • End-to-end latency for market data updates should be under 200ms.  
  • Able to handle at least 50 concurrent symbol subscriptions per client.

- **Security:**  
  • API keys and credentials must never be hard-coded—use `.env`.  
  • Support TLS encryption on WebSocket and HTTP connections.

- **Reliability:**  
  • Automatic reconnection and session recovery on WebSocket dropouts.  
  • Graceful error handling with informative messages in `onError`.

- **Usability:**  
  • Clear, consistent method names and parameters.  
  • Helpful logging and debug flags for development.

- **Compliance:**  
  • Adhere to TradingView’s terms of service regarding data usage.  
  • Respect rate limits and avoid abusive request patterns.

---

## 7. Constraints & Assumptions

- **TradingView API Access:** Requires valid TradingView credentials or API token.  
- **Node.js Environment:** Users will run on Node.js, not in browsers.  
- **Network Connectivity:** Stable Internet connection is assumed for WebSocket streams.  
- **Library Versioning:** v1.0 will be non-breaking; breaking changes to follow semantic versioning.

---

## 8. Known Issues & Potential Pitfalls

- **Rate Limits:**  TradingView may throttle clients sending too many requests—guide users to throttle their own calls or implement backoff.
- **Missing Type Safety:**  JavaScript lacks compile-time checks; consider migrating to TypeScript in a future release.
- **Partial Error Coverage:**  Some edge-case errors may not emit `onError`—plan a centralized error handler as an improvement.
- **WebSocket Reconnection Loops:**  Uncontrolled reconnection logic can cause rapid retry storms. Implement exponential backoff.
- **Permission Errors:**  Custom Pine Scripts may require special user permissions—ensure errors clearly indicate permission failures.

---

This document serves as the authoritative reference for the TradingView-API v1.0. All subsequent technical designs—such as detailed API endpoints, file structure guidelines, and CI/CD pipelines—should align with these requirements and constraints.