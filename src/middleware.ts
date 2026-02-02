import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

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

  // Content Security Policy
  const ffmpegServiceUrl = process.env.NEXT_PUBLIC_FFMPEG_SERVICE_URL;
  const connectSrc = ['\'self\'', 'https://unpkg.com', ffmpegServiceUrl].filter(Boolean).join(' ');

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "worker-src 'self' blob:",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: '/:path*',
};
