import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TradingViewMarketData, MARKETS, SCAN_COLUMNS, FILTER_OPERATIONS } from '../src/marketDataApi';

// Mock the robustHttpClient
vi.mock('../src/robustHttpClient', () => ({
  robustHttpClient: {
    post: vi.fn(),
    get: vi.fn()
  }
}));

import { robustHttpClient } from '../src/robustHttpClient';

describe('TradingViewMarketData', () => {
  let marketData;
  const mockHttpClient = robustHttpClient as any;

  beforeEach(() => {
    marketData = new TradingViewMarketData();
    vi.clearAllMocks();
  });

  describe('getAvailableMarkets', () => {
    it('should return available markets', () => {
      const markets = marketData.getAvailableMarkets();
      
      expect(markets).toEqual(MARKETS);
      expect(markets.AMERICA).toBeDefined();
      expect(markets.EUROPE).toBeDefined();
      expect(markets.ASIA).toBeDefined();
    });
  });

  describe('getAvailableColumns', () => {
    it('should return available columns', () => {
      const columns = marketData.getAvailableColumns();
      
      expect(columns).toEqual(SCAN_COLUMNS);
      expect(columns.name).toBe('Name');
      expect(columns.close).toBe('Price');
    });
  });

  describe('getMarketOverview', () => {
    it('should fetch market overview successfully', async () => {
      const mockResponse = {
        data: {
          totalCount: 100,
          data: [
            {
              s: 'NASDAQ:AAPL',
              d: ['Apple Inc.', 150.0, 2.5, 1000000, 2500000000000]
            }
          ]
        }
      };
      
      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await marketData.getMarketOverview('AMERICA', {
        columns: ['name', 'close', 'change', 'volume', 'market_cap_basic'],
        limit: 5
      });

      expect(result.market).toBe('America');
      expect(result.totalCount).toBe(100);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].symbol).toBe('NASDAQ:AAPL');
    });

    it('should throw error for invalid market', async () => {
      await expect(marketData.getMarketOverview('INVALID_MARKET'))
        .rejects.toThrow('Invalid market: INVALID_MARKET');
    });
  });

  describe('scanStocks', () => {
    it('should scan stocks with filters successfully', async () => {
      const mockResponse = {
        data: {
          totalCount: 50,
          data: [
            {
              s: 'NYSE:MSFT',
              d: ['Microsoft Corporation', 300.0, 1.5, 2000000]
            }
          ]
        }
      };
      
      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await marketData.scanStocks({
        columns: ['name', 'close', 'change', 'volume'],
        filters: [
          {
            left: 'market_cap_basic',
            operation: 'greater',
            right: 1000000000
          }
        ],
        limit: 10
      });

      expect(result.totalCount).toBe(50);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].symbol).toBe('NYSE:MSFT');
      expect(result.hasMore).toBe(true);
    });

    it('should handle empty results', async () => {
      const mockResponse = {
        data: {
          totalCount: 0,
          data: []
        }
      };
      
      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await marketData.scanStocks();

      expect(result.totalCount).toBe(0);
      expect(result.data).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('fetchAllStocks', () => {
    it('should fetch all stocks with pagination', async () => {
      // Mock multiple paginated responses
      const mockResponse1 = {
        data: {
          totalCount: 2,
          data: [
            { s: 'NASDAQ:AAPL', d: ['Apple Inc.', 150.0] }
          ]
        }
      };
      
      const mockResponse2 = {
        data: {
          totalCount: 2,
          data: [
            { s: 'NYSE:MSFT', d: ['Microsoft Corporation', 300.0] }
          ]
        }
      };

      mockHttpClient.post
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const progressSpy = vi.fn();
      
      const result = await marketData.fetchAllStocks({
        columns: ['name', 'close'],
        maxResults: 2,
        onProgress: progressSpy
      });

      expect(result.totalCount).toBe(2);
      expect(result.fetchedCount).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(progressSpy).toHaveBeenCalled();
    });
  });

  describe('validateConnection', () => {
    it('should validate connection successfully', async () => {
      const mockResponse = {
        data: {
          totalCount: 1,
          data: [
            { s: 'NASDAQ:AAPL', d: ['Apple Inc.', 150.0] }
          ]
        }
      };
      
      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await marketData.validateConnection();

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Connection successful');
      expect(result.sampleData).toBeDefined();
    });

    it('should handle connection failure', async () => {
      mockHttpClient.post.mockRejectedValueOnce(new Error('Network error'));

      const result = await marketData.validateConnection();

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Connection failed');
    });
  });

  describe('parseScannedData', () => {
    it('should parse raw data correctly', () => {
      const rawData = [
        {
          s: 'NASDAQ:AAPL',
          d: {
            description: 'Apple Inc.',
            0: 'Apple Inc.',
            1: 150.0,
            2: 2.5
          }
        }
      ];
      
      const columns = ['name', 'close', 'change'];
      const result = marketData.parseScannedData(rawData, columns);

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('NASDAQ:AAPL');
      expect(result[0].description).toBe('Apple Inc.');
      expect(result[0].name).toBe('Apple Inc.');
      expect(result[0].close).toBe(150.0);
    });
  });

  describe('formatValue', () => {
    it('should format price values correctly', () => {
      expect(marketData.formatValue('close', 150.123)).toBe('150.12');
      expect(marketData.formatValue('price', 50.5)).toBe('50.50');
    });

    it('should format percentage values correctly', () => {
      expect(marketData.formatValue('change', 0.025)).toBe('2.50%');
      expect(marketData.formatValue('Perf.W', -0.1)).toBe('-10.00%');
    });

    it('should format large numbers correctly', () => {
      expect(marketData.formatNumber(1500000000)).toBe('1.50B');
      expect(marketData.formatNumber(2500000)).toBe('2.50M');
      expect(marketData.formatNumber(1500)).toBe('1.50K');
    });
  });
});

describe('Module exports', () => {
  it('should export MARKETS constant', () => {
    expect(MARKETS).toBeDefined();
    expect(MARKETS.AMERICA).toBeDefined();
    expect(MARKETS.AMERICA.name).toBe('America');
  });

  it('should export SCAN_COLUMNS constant', () => {
    expect(SCAN_COLUMNS).toBeDefined();
    expect(SCAN_COLUMNS.name).toBe('Name');
    expect(SCAN_COLUMNS.close).toBe('Price');
  });

  it('should export FILTER_OPERATIONS constant', () => {
    expect(FILTER_OPERATIONS).toBeDefined();
    expect(FILTER_OPERATIONS.greater).toBe('>');
    expect(FILTER_OPERATIONS.less).toBe('<');
  });
});