import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TradingViewHelpers from '../src/helpers';

// Mock console methods to avoid noise in tests
const originalConsole = global.console;

describe('TradingViewHelpers', () => {
  beforeEach(() => {
    global.console = {
      ...originalConsole,
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
  });

  afterEach(() => {
    global.console = originalConsole;
  });

  describe('createChart', () => {
    it('should create a chart with default options', () => {
      const mockClient = {
        Session: {
          Chart: vi.fn(() => ({ setMarket: vi.fn() })),
        },
      };
      
      const chart = TradingViewHelpers.createChart(mockClient);
      
      expect(mockClient.Session.Chart).toHaveBeenCalled();
      expect(chart.setMarket).toHaveBeenCalled();
    });

    it('should create a chart with custom options', () => {
      const mockSetMarket = vi.fn();
      const mockClient = {
        Session: {
          Chart: vi.fn(() => ({ setMarket: mockSetMarket })),
        },
      };
      
      const options = {
        market: 'BINANCE:BTCUSDT',
        timeframe: '1h',
        type: 'Candles',
      };
      
      const chart = TradingViewHelpers.createChart(mockClient, options);
      
      expect(mockClient.Session.Chart).toHaveBeenCalled();
      expect(mockSetMarket).toHaveBeenCalledWith('BINANCE:BTCUSDT', {
        market: 'BINANCE:BTCUSDT',
        timeframe: '1h',
        type: 'Candles',
      });
    });
  });

  describe('setupChartHandlers', () => {
    it('should setup default chart handlers', () => {
      const mockChart = {
        onError: vi.fn(),
        onSymbolLoaded: vi.fn(),
        onUpdate: vi.fn(),
        onReady: vi.fn(),
      };
      
      TradingViewHelpers.setupChartHandlers(mockChart);
      
      expect(mockChart.onError).toHaveBeenCalled();
      expect(mockChart.onSymbolLoaded).toHaveBeenCalled();
      expect(mockChart.onUpdate).toHaveBeenCalled();
      expect(mockChart.onReady).toHaveBeenCalled();
    });

    it('should setup only specified handlers', () => {
      const mockChart = {
        onError: vi.fn(),
        onSymbolLoaded: vi.fn(),
        onUpdate: vi.fn(),
        onReady: vi.fn(),
      };
      
      const options = {
        onError: true,
        onSymbolLoaded: false,
        onUpdate: false,
        onReady: false,
      };
      
      TradingViewHelpers.setupChartHandlers(mockChart, options);
      
      expect(mockChart.onError).toHaveBeenCalled();
      expect(mockChart.onSymbolLoaded).not.toHaveBeenCalled();
      expect(mockChart.onUpdate).not.toHaveBeenCalled();
      expect(mockChart.onReady).not.toHaveBeenCalled();
    });
  });

  describe('delay', () => {
    it('should create a delay for the specified time', async () => {
      const startTime = Date.now();
      await TradingViewHelpers.delay(100);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(90);
    });
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const successFn = vi.fn(() => Promise.resolve('success'));
      
      const result = await TradingViewHelpers.retry(successFn);
      
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const failTwiceFn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const result = await TradingViewHelpers.retry(failTwiceFn, 3, 10);
      
      expect(result).toBe('success');
      expect(failTwiceFn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const alwaysFailFn = vi.fn(() => Promise.reject(new Error('Always fails')));
      
      await expect(TradingViewHelpers.retry(alwaysFailFn, 2, 10))
        .rejects.toThrow('Failed after 2 attempts');
      
      expect(alwaysFailFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('formatMarketData', () => {
    it('should format market data correctly', () => {
      const period = {
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1000000,
      };
      
      const result = TradingViewHelpers.formatMarketData(period, 'USD');
      
      expect(result).toEqual({
        price: 105,
        change: '5.0000',
        changePercent: '5.00%',
        range: '95 - 110',
        volume: '1,000,000',
        currency: 'USD',
      });
    });

    it('should handle missing volume', () => {
      const period = {
        open: 100,
        high: 110,
        low: 95,
        close: 105,
      };
      
      const result = TradingViewHelpers.formatMarketData(period);
      
      expect(result.volume).toBe('N/A');
    });
  });

  describe('isValidMarketSymbol', () => {
    it('should validate correct market symbols', () => {
      expect(TradingViewHelpers.isValidMarketSymbol('BINANCE:BTCUSDT')).toBe(true);
      expect(TradingViewHelpers.isValidMarketSymbol('NASDAQ:AAPL')).toBe(true);
      expect(TradingViewHelpers.isValidMarketSymbol('FX:EURUSD')).toBe(true);
    });

    it('should reject invalid market symbols', () => {
      expect(TradingViewHelpers.isValidMarketSymbol('BTCUSDT')).toBe(false);
      expect(TradingViewHelpers.isValidMarketSymbol('binance:btcusdt')).toBe(false);
      expect(TradingViewHelpers.isValidMarketSymbol('')).toBe(false);
      expect(TradingViewHelpers.isValidMarketSymbol('BINANCE:')).toBe(false);
    });
  });

  describe('getTimeframes', () => {
    it('should return available timeframes', () => {
      const timeframes = TradingViewHelpers.getTimeframes();
      
      expect(timeframes).toEqual({
        1: '1 minute',
        5: '5 minutes',
        15: '15 minutes',
        30: '30 minutes',
        60: '1 hour',
        240: '4 hours',
        '1D': '1 day',
        '1W': '1 week',
        '1M': '1 month',
      });
    });
  });

  describe('getChartTypes', () => {
    it('should return available chart types', () => {
      const chartTypes = TradingViewHelpers.getChartTypes();
      
      expect(chartTypes).toEqual({
        Bars: 'Bars',
        Candles: 'Candles',
        HollowCandles: 'Hollow Candles',
        HeikinAshi: 'Heikin Ashi',
        Line: 'Line',
        Area: 'Area',
        Baseline: 'Baseline',
      });
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const jsonString = '{"key": "value", "number": 123}';
      const result = TradingViewHelpers.safeJsonParse(jsonString);
      
      expect(result).toEqual({ key: 'value', number: 123 });
    });

    it('should return default value for invalid JSON', () => {
      const invalidJson = '{"key": invalid}';
      const defaultValue = { error: true };
      const result = TradingViewHelpers.safeJsonParse(invalidJson, defaultValue);
      
      expect(result).toEqual(defaultValue);
    });

    it('should return null as default for invalid JSON', () => {
      const invalidJson = 'not json at all';
      const result = TradingViewHelpers.safeJsonParse(invalidJson);
      
      expect(result).toBeNull();
    });
  });

  describe('timeout', () => {
    it('should create a promise that rejects after timeout', async () => {
      const timeoutPromise = TradingViewHelpers.timeout(100, 'Test timeout');
      
      await expect(timeoutPromise).rejects.toThrow('Test timeout');
    });
  });
});