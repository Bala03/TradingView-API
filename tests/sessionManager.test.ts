import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing
vi.mock('../src/miscRequests', () => ({
  default: {
    getUser: vi.fn(),
    loginUser: vi.fn(),
  },
}));

const mockConfig = {
  hasSession: false,
  auth: {
    username: 'test@example.com',
    password: 'password123',
    rememberSession: false,
    userAgent: 'test-agent',
  },
  isAuthenticated: true,
};

vi.mock('../src/config', () => ({
  default: mockConfig,
}));

// Import after mocking
import sessionManager from '../src/sessionManager';
import * as TradingView from '../src/miscRequests';

describe('SessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionManager.clearSession();
    
    // Set environment variables for testing
    process.env.TRADINGVIEW_USERNAME = 'test@example.com';
    process.env.TRADINGVIEW_PASSWORD = 'password123';
    process.env.TRADINGVIEW_USER_AGENT = 'test-agent';
    
    // Reset config to defaults
    mockConfig.hasSession = false;
    mockConfig.isAuthenticated = true;
  });

  afterEach(() => {
    sessionManager.clearSession();
  });

  describe('getSession', () => {
    it('should return existing valid session', async () => {
      const mockSession = {
        username: 'testuser',
        session: 'session123',
        signature: 'signature456',
      };
      
      sessionManager.currentSession = mockSession;
      
      const session = await sessionManager.getSession();
      expect(session).toBe(mockSession);
    });

    it('should create new session when none exists', async () => {
      const mockUser = {
        username: 'testuser',
        session: 'session123',
        signature: 'signature456',
      };
      
      TradingView.default.loginUser.mockResolvedValue(mockUser);
      
      const session = await sessionManager.getSession();
      expect(session).toBe(mockUser);
      expect(TradingView.default.loginUser).toHaveBeenCalled();
    });

    it('should not create multiple sessions simultaneously', async () => {
      const mockUser = {
        username: 'testuser',
        session: 'session123',
        signature: 'signature456',
      };
      
      TradingView.default.loginUser.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      );
      
      const session1Promise = sessionManager.getSession();
      const session2Promise = sessionManager.getSession();
      
      const [session1, session2] = await Promise.all([session1Promise, session2Promise]);
      
      expect(session1).toBe(mockUser);
      expect(session2).toBe(mockUser);
      expect(TradingView.default.loginUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('authenticate', () => {
    it('should use stored session if available', async () => {
      const mockStoredSession = {
        username: 'storeduser',
        session: 'stored_session',
        signature: 'stored_signature',
      };
      
      TradingView.default.getUser.mockResolvedValue(mockStoredSession);
      
      // Update mock config to have session
      mockConfig.hasSession = true;
      mockConfig.auth.sessionId = 'stored_session';
      mockConfig.auth.signature = 'stored_signature';
      
      const session = await sessionManager.authenticate();
      expect(session).toBe(mockStoredSession);
      expect(TradingView.default.getUser).toHaveBeenCalledWith(
        'stored_session',
        'stored_signature'
      );
    });

    it('should login with credentials when no stored session', async () => {
      const mockUser = {
        username: 'testuser',
        session: 'new_session',
        signature: 'new_signature',
      };
      
      TradingView.default.loginUser.mockResolvedValue(mockUser);
      
      const session = await sessionManager.authenticate();
      expect(session).toBe(mockUser);
      expect(TradingView.default.loginUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        false,
        'test-agent'
      );
    });

    it('should throw error when no credentials provided', async () => {
      delete process.env.TRADINGVIEW_USERNAME;
      delete process.env.TRADINGVIEW_PASSWORD;
      
      await expect(sessionManager.authenticate()).rejects.toThrow(
        'No authentication credentials provided'
      );
      
      // Restore environment variables
      process.env.TRADINGVIEW_USERNAME = 'test@example.com';
      process.env.TRADINGVIEW_PASSWORD = 'password123';
    });

    it('should handle login failure and retry with stored session', async () => {
      const mockStoredSession = {
        username: 'storeduser',
        session: 'stored_session',
        signature: 'stored_signature',
      };
      
      TradingView.default.getUser
        .mockRejectedValueOnce(new Error('Stored session invalid'))
        .mockResolvedValue(mockStoredSession);
      
      // Update mock config to have session
      mockConfig.hasSession = true;
      mockConfig.auth.sessionId = 'stored_session';
      mockConfig.auth.signature = 'stored_signature';
      
      const session = await sessionManager.authenticate();
      expect(session).toBe(mockStoredSession);
    });
  });

  describe('isSessionValid', () => {
    it('should return false for no session', () => {
      expect(sessionManager.isSessionValid()).toBe(false);
    });

    it('should return true for valid session', () => {
      sessionManager.currentSession = {
        session: 'session123',
        signature: 'signature456',
      };
      
      expect(sessionManager.isSessionValid()).toBe(true);
    });

    it('should return false for incomplete session', () => {
      sessionManager.currentSession = {
        session: 'session123',
        // missing signature
      };
      
      expect(sessionManager.isSessionValid()).toBe(false);
    });
  });

  describe('refreshSession', () => {
    it('should clear current session and get new one', async () => {
      const oldSession = { session: 'old_session' };
      const newSession = { session: 'new_session' };
      
      sessionManager.currentSession = oldSession;
      
      TradingView.default.loginUser.mockResolvedValue(newSession);
      
      const session = await sessionManager.refreshSession();
      expect(session).toBe(newSession);
      expect(sessionManager.currentSession).toBe(newSession);
    });
  });

  describe('getSessionCookies', () => {
    it('should return formatted cookie string', () => {
      sessionManager.currentSession = {
        session: 'session123',
        signature: 'signature456',
      };
      
      const cookies = sessionManager.getSessionCookies();
      expect(cookies).toBe('sessionid=session123;sessionid_sign=signature456');
    });

    it('should throw error when no session', () => {
      expect(() => sessionManager.getSessionCookies()).toThrow(
        'No active session'
      );
    });
  });

  describe('getSessionInfo', () => {
    it('should return session info when session exists', () => {
      sessionManager.currentSession = {
        username: 'testuser',
        session: 'session123',
        signature: 'signature456',
        id: 'user123',
      };
      
      const info = sessionManager.getSessionInfo();
      expect(info).toEqual({
        isAuthenticated: true,
        username: 'testuser',
        sessionId: 'session123',
        signature: 'signature456',
        userId: 'user123',
      });
    });

    it('return not authenticated info when no session', () => {
      const info = sessionManager.getSessionInfo();
      expect(info).toEqual({
        isAuthenticated: false,
        message: 'No active session',
      });
    });
  });

  describe('restoreSession', () => {
    it('should return existing session if valid', async () => {
      const mockSession = {
        username: 'testuser',
        session: 'session123',
        signature: 'signature456',
      };
      
      sessionManager.currentSession = mockSession;
      
      const session = await sessionManager.restoreSession();
      expect(session).toBe(mockSession);
    });

    it('should re-authenticate if no valid session', async () => {
      const mockUser = {
        username: 'testuser',
        session: 'new_session',
        signature: 'new_signature',
      };
      
      TradingView.default.loginUser.mockResolvedValue(mockUser);
      
      const session = await sessionManager.restoreSession();
      expect(session).toBe(mockUser);
      expect(TradingView.default.loginUser).toHaveBeenCalled();
    });
  });

  describe('clearSession', () => {
    it('should clear current session', () => {
      sessionManager.currentSession = { session: 'session123' };
      
      sessionManager.clearSession();
      expect(sessionManager.currentSession).toBeNull();
    });
  });

  describe('updateEnvironmentSession', () => {
    it('should update environment variables', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      sessionManager.updateEnvironmentSession('new_session', 'new_signature');
      
      expect(process.env.TRADINGVIEW_SESSION_ID).toBe('new_session');
      expect(process.env.TRADINGVIEW_SIGNATURE).toBe('new_signature');
      
      consoleSpy.mockRestore();
    });
  });
});