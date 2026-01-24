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

  return response;
}

export const config = {
  matcher: '/:path*',
};
