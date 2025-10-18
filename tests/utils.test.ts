import { describe, it, expect } from 'vitest';
import utils from '../src/utils';

describe('Utils', () => {
  describe('genSessionID', () => {
    it('should generate a session ID with default type', () => {
      const sessionId = utils.genSessionID();
      
      expect(sessionId).toMatch(/^xs_[A-Za-z0-9]{12}$/);
      expect(sessionId.length).toBe(15); // "xs_" + 12 characters
    });

    it('should generate a session ID with custom type', () => {
      const sessionId = utils.genSessionID('cs');
      
      expect(sessionId).toMatch(/^cs_[A-Za-z0-9]{12}$/);
      expect(sessionId.length).toBe(15); // "cs_" + 12 characters
    });

    it('should generate unique session IDs', () => {
      const sessionId1 = utils.genSessionID();
      const sessionId2 = utils.genSessionID();
      
      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should handle empty type', () => {
      const sessionId = utils.genSessionID('');
      
      expect(sessionId).toMatch(/^_[A-Za-z0-9]{12}$/);
      expect(sessionId.length).toBe(13); // "_" + 12 characters
    });
  });

  describe('genAuthCookies', () => {
    it('should return empty string when no session ID provided', () => {
      const cookies = utils.genAuthCookies();
      expect(cookies).toBe('');
    });

    it('should return session ID cookie when no signature provided', () => {
      const cookies = utils.genAuthCookies('session123');
      expect(cookies).toBe('sessionid=session123');
    });

    it('should return both cookies when session ID and signature provided', () => {
      const cookies = utils.genAuthCookies('session123', 'signature456');
      expect(cookies).toBe('sessionid=session123;sessionid_sign=signature456');
    });

    it('should handle empty session ID with signature', () => {
      const cookies = utils.genAuthCookies('', 'signature456');
      expect(cookies).toBe('');
    });

    it('should handle empty signature', () => {
      const cookies = utils.genAuthCookies('session123', '');
      expect(cookies).toBe('sessionid=session123');
    });
  });
});