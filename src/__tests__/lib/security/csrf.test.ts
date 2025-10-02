/**
 * CSRF Security Tests
 *
 * Critical security tests for CSRF protection
 */

import { generateCsrfToken, checkCsrf } from '@/lib/security/csrf';
import { NextRequest } from 'next/server';

describe('CSRF Protection', () => {
  describe('generateCsrfToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateCsrfToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('checkCsrf', () => {
    it('should allow safe methods (GET, HEAD, OPTIONS)', () => {
      const getRequest = new NextRequest('http://localhost/api/test', {
        method: 'GET',
      });
      expect(checkCsrf(getRequest)).toBe(true);

      const headRequest = new NextRequest('http://localhost/api/test', {
        method: 'HEAD',
      });
      expect(checkCsrf(headRequest)).toBe(true);

      const optionsRequest = new NextRequest('http://localhost/api/test', {
        method: 'OPTIONS',
      });
      expect(checkCsrf(optionsRequest)).toBe(true);
    });

    it('should reject state-changing methods without CSRF token', () => {
      const postRequest = new NextRequest('http://localhost/api/test', {
        method: 'POST',
      });
      expect(checkCsrf(postRequest)).toBe(false);
    });

    it('should accept state-changing methods with valid CSRF token', () => {
      const token = generateCsrfToken();
      const postRequest = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
        },
      });
      expect(checkCsrf(postRequest)).toBe(true);
    });
  });
});
