import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  // Content Security Policy
  // script-src: 'unsafe-eval' 'unsafe-inline' needed for Next.js and some libs.
  // unpkg.com for ffmpeg, blob: for workers/media.
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com blob:;
    worker-src 'self' blob: https://unpkg.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    media-src 'self' blob: data:;
    connect-src 'self' https://unpkg.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', csp);

  // Security Headers
  // Prevents the site from being embedded in an iframe (clickjacking protection)
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevents the browser from MIME-sniffing a response away from the declared content-type
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Controls how much referrer information should be included with requests
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Disables access to camera, microphone, and geolocation by default
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Enforces HTTPS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  return response;
}

export const config = {
  matcher: '/:path*',
};
