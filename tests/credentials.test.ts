import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TradingViewApiCredentials, globalCredentials } from '../src/TradingViewApi.credentials';

describe('TradingViewApiCredentials', () => {
  let credentials;

  beforeEach(() => {
    credentials = new TradingViewApiCredentials();
  });

  describe('setCredentials', () => {
    it('should set credentials correctly', () => {
      credentials.setCredentials('test_session', 'test_signature');
      
      expect(credentials.sessionId).toBe('test_session');
      expect(credentials.signature).toBe('test_signature');
      expect(credentials.isAuthenticated).toBe(true);
    });

    it('should mark as authenticated when sessionId is provided', () => {
      credentials.setCredentials('test_session');
      
      expect(credentials.isAuthenticated).toBe(true);
    });

    it('should not mark as authenticated when no sessionId is provided', () => {
      credentials.setCredentials('');
      
      expect(credentials.isAuthenticated).toBe(false);
    });
  });

  describe('getCredentials', () => {
    it('should return current credentials', () => {
      credentials.setCredentials('session123', 'signature456');
      
      const creds = credentials.getCredentials();
      
      expect(creds.sessionId).toBe('session123');
      expect(creds.signature).toBe('signature456');
      expect(creds.isAuthenticated).toBe(true);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return headers with authentication when credentials are set', () => {
      credentials.setCredentials('session123', 'signature456');
      
      const headers = credentials.getAuthHeaders();
      
      expect(headers).toHaveProperty('origin', 'https://www.tradingview.com');
      expect(headers).toHaveProperty('referer', 'https://www.tradingview.com');
      expect(headers).toHaveProperty('user-agent');
      expect(headers).toHaveProperty('cookie');
    });

    it('should return headers without cookie when no credentials are set', () => {
      const headers = credentials.getAuthHeaders();
      
      expect(headers).toHaveProperty('origin', 'https://www.tradingview.com');
      expect(headers).not.toHaveProperty('cookie');
    });
  });

  describe('hasCredentials', () => {
    it('should return true when sessionId is set', () => {
      credentials.setCredentials('session123');
      
      expect(credentials.hasCredentials()).toBe(true);
    });

    it('should return false when no sessionId is set', () => {
      expect(credentials.hasCredentials()).toBe(false);
    });
  });

  describe('clearCredentials', () => {
    it('should clear all credentials', () => {
      credentials.setCredentials('session123', 'signature456');
      credentials.clearCredentials();
      
      expect(credentials.sessionId).toBe(null);
      expect(credentials.signature).toBe(null);
      expect(credentials.isAuthenticated).toBe(false);
      expect(credentials.user).toBe(null);
    });
  });

  describe('getStatus', () => {
    it('should return correct status information', () => {
      credentials.setCredentials('session123');
      
      const status = credentials.getStatus();
      
      expect(status.hasCredentials).toBe(true);
      expect(status.isAuthenticated).toBe(true);
      expect(status.lastValidated).toBe(null);
      expect(status.user).toBe(null);
    });
  });
});

describe('globalCredentials singleton', () => {
  it('should be a TradingViewApiCredentials instance', () => {
    expect(globalCredentials).toBeInstanceOf(TradingViewApiCredentials);
  });

  it('should maintain state across calls', () => {
    globalCredentials.setCredentials('global_session');
    
    expect(globalCredentials.hasCredentials()).toBe(true);
    expect(globalCredentials.sessionId).toBe('global_session');
  });
});