import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RobustHttpClient } from '../src/robustHttpClient';

// Mock axios
vi.mock('axios');
import axios from 'axios';

describe('RobustHttpClient', () => {
  let client;
  const mockAxios = axios as any;

  beforeEach(() => {
    client = new RobustHttpClient({
      maxRetries: 2,
      baseDelay: 100,
      rateLimit: { requests: 5, window: 1000 }
    });
    
    vi.clearAllMocks();
    client.resetStats();
  });

  describe('request success', () => {
    it('should make successful request on first try', async () => {
      const mockResponse = { status: 200, data: { success: true } };
      mockAxios.mockResolvedValueOnce(mockResponse);

      const response = await client.request({ url: 'https://test.com' });

      expect(response).toBe(mockResponse);
      expect(client.getStats().successfulRequests).toBe(1);
      expect(client.getStats().retriedRequests).toBe(0);
    });
  });

  describe('retry logic', () => {
    it('should retry on network errors', async () => {
      const networkError = new Error('Network error');
      const successResponse = { status: 200, data: { success: true } };
      
      mockAxios
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse);

      const response = await client.request({ url: 'https://test.com' });

      expect(response).toBe(successResponse);
      expect(client.getStats().successfulRequests).toBe(1);
      expect(client.getStats().retriedRequests).toBe(1);
    });

    it('should fail after max retries', async () => {
      const networkError = new Error('Network error');
      
      mockAxios
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError);

      await expect(client.request({ url: 'https://test.com' }))
        .rejects.toThrow('Request failed after 3 attempts');

      expect(client.getStats().failedRequests).toBe(1);
      expect(client.getStats().retriedRequests).toBe(2);
    });
  });

  describe('rate limiting', () => {
    it('should track request history for rate limiting', () => {
      expect(client.isRateLimited()).toBe(false);
      
      // Simulate multiple requests
      for (let i = 0; i < 5; i++) {
        client.requestHistory.push(Date.now());
      }
      
      expect(client.isRateLimited()).toBe(true);
    });

    it('should calculate rate limit delay correctly', () => {
      const now = Date.now();
      client.requestHistory = [now - 500]; // Request 500ms ago
      
      const delay = client.getRateLimitDelay();
      
      expect(delay).toBeGreaterThan(0);
      expect(delay).toBeLessThan(1000);
    });
  });

  describe('HTTP status handling', () => {
    it('should handle 429 rate limit with retry', async () => {
      const rateLimitResponse = { 
        status: 429, 
        headers: { 'retry-after': '1' }
      };
      const successResponse = { status: 200, data: { success: true } };
      
      mockAxios
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(successResponse);

      const response = await client.request({ url: 'https://test.com' });

      expect(response).toBe(successResponse);
      expect(client.getStats().rateLimitedRequests).toBe(1);
    });

    it('should throw on authentication errors without retry', async () => {
      const authError = { status: 401, statusText: 'Unauthorized' };
      mockAxios.mockResolvedValueOnce(authError);

      await expect(client.request({ url: 'https://test.com' }))
        .rejects.toThrow('Authentication failed (401)');

      expect(client.getStats().failedRequests).toBe(1);
      expect(client.getStats().retriedRequests).toBe(0);
    });
  });

  describe('convenience methods', () => {
    it('should provide GET method', async () => {
      const mockResponse = { status: 200, data: { success: true } };
      mockAxios.mockResolvedValueOnce(mockResponse);

      const response = await client.get('https://test.com');

      expect(response).toBe(mockResponse);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'https://test.com'
        })
      );
    });

    it('should provide POST method', async () => {
      const mockResponse = { status: 200, data: { success: true } };
      const postData = { key: 'value' };
      mockAxios.mockResolvedValueOnce(mockResponse);

      const response = await client.post('https://test.com', postData);

      expect(response).toBe(mockResponse);
      expect(mockAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://test.com',
          data: postData
        })
      );
    });
  });

  describe('statistics', () => {
    it('should track statistics correctly', async () => {
      const mockResponse = { status: 200, data: { success: true } };
      mockAxios.mockResolvedValueOnce(mockResponse);

      await client.request({ url: 'https://test.com' });

      const stats = client.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.successfulRequests).toBe(1);
      expect(stats.failedRequests).toBe(0);
    });

    it('should reset statistics correctly', () => {
      client.stats.totalRequests = 10;
      client.stats.successfulRequests = 8;
      
      client.resetStats();
      
      const stats = client.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
    });
  });
});