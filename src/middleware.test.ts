import { describe, it, expect } from 'vitest';
import { middleware } from './middleware';
import { NextRequest } from 'next/server';

describe('Middleware', () => {
  it('should add Content-Security-Policy header', () => {
    const request = new NextRequest('http://localhost/');
    const response = middleware(request);

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain('https://unpkg.com');
    expect(csp).toContain('https://vercel.live');
    expect(csp).toContain('https://r2cdn.perplexity.ai');
  });

  it('should maintain existing security headers', () => {
    const request = new NextRequest('http://localhost/');
    const response = middleware(request);

    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(response.headers.get('Strict-Transport-Security')).toBeDefined();
    expect(response.headers.get('Permissions-Policy')).toBeDefined();
  });
});
