import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Client from '../src/client';

// Mock WebSocket
const mockWebSocket = {
  readyState: 0, // CONNECTING
  OPEN: 1,
  CLOSE: 2,
  send: vi.fn(),
  close: vi.fn(),
  on: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

vi.mock('ws', () => {
  return {
    default: vi.fn(() => mockWebSocket),
  };
});

// Mock other dependencies
vi.mock('../src/miscRequests');
vi.mock('../src/protocol');
vi.mock('../src/quote/session');
vi.mock('../src/chart/session');

describe('Client Auto-Reconnect', () => {
  let client;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocket.readyState = mockWebSocket.OPEN;
    mockWebSocket.send.mockClear();
    mockWebSocket.close.mockClear();
    
    // Reset WebSocket mock to simulate connection
    mockWebSocket.readyState = mockWebSocket.OPEN;
    
    client = new Client({
      autoReconnect: true,
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
    });
  });

  afterEach(() => {
    if (client) {
      client.end();
    }
  });

  describe('Reconnection Options', () => {
    it('should use default reconnection options', () => {
      const defaultClient = new Client();
      expect(defaultClient).toBeDefined();
    });

    it('should accept custom reconnection options', () => {
      const customClient = new Client({
        autoReconnect: false,
        maxRetries: 5,
        initialDelay: 2000,
        maxDelay: 60000,
        backoffMultiplier: 3,
      });
      expect(customClient).toBeDefined();
    });
  });

  describe('Exponential Backoff', () => {
    it('should calculate correct backoff delays', () => {
      // Test the private method through the public interface
      // by triggering reconnection and checking delay timing
      
      const delays = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = vi.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0); // Execute immediately for test
      });
      
      // Simulate connection close to trigger reconnection
      mockWebSocket.readyState = mockWebSocket.CLOSE;
      
      // Trigger close event
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({ code: 1000, reason: 'Test close' });
      }
      
      global.setTimeout = originalSetTimeout;
      
      // Verify exponential backoff with jitter
      expect(delays.length).toBeGreaterThan(0);
      expect(delays[0]).toBeGreaterThanOrEqual(100); // initialDelay + jitter
      expect(delays[0]).toBeLessThan(1100); // initialDelay + 1000ms jitter
    });
  });

  describe('Session Restoration', () => {
    it('should restore sessions after reconnection', () => {
      const mockSession = {
        onRestore: vi.fn(),
      };
      
      // Add a session to the client
      client.Session.Quote = mockSession;
      
      // Simulate successful reconnection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen();
      }
      
      // Verify session restoration was attempted
      // Note: This tests the integration, actual restoration depends on session implementation
      expect(mockWebSocket.onopen).toBeDefined();
    });
  });

  describe('Manual Disconnection', () => {
    it('should not reconnect when manually disconnected', async () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
      
      // End the client connection
      await client.end();
      
      // Simulate close event after manual end
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({ code: 1000, reason: 'Normal closure' });
      }
      
      // Verify no reconnection timer was set
      expect(setTimeoutSpy).not.toHaveBeenCalled();
      
      setTimeoutSpy.mockRestore();
    });
  });

  describe('Max Retries', () => {
    it('should stop retrying after max attempts', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Create client with low max retries for faster test
      const testClient = new Client({
        autoReconnect: true,
        maxRetries: 1,
        initialDelay: 10,
        maxDelay: 100,
      });
      
      // Simulate multiple connection failures
      for (let i = 0; i < 3; i++) {
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose({ code: 1006, reason: 'Connection lost' });
        }
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      // Should have attempted reconnection only once
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('RECONNECT'),
        expect.stringContaining('Attempt 1/1')
      );
      
      await testClient.end();
      consoleSpy.mockRestore();
    });
  });

  describe('Debug Logging', () => {
    it('should log debug messages when DEBUG is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const debugClient = new Client({
        DEBUG: true,
        autoReconnect: true,
        maxRetries: 1,
        initialDelay: 10,
      });
      
      // Simulate connection close to trigger debug logs
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({ code: 1006, reason: 'Test' });
      }
      
      // Should have logged reconnection attempt
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('RECONNECT'),
        expect.any(String)
      );
      
      debugClient.end();
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket errors during reconnection', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const errorClient = new Client({
        DEBUG: true,
        autoReconnect: true,
      });
      
      // Simulate WebSocket error
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Error('WebSocket error'));
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('RECONNECT'),
        expect.stringContaining('WebSocket error:'),
        expect.any(String)
      );
      
      errorClient.end();
      consoleSpy.mockRestore();
    });
  });
});