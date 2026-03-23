import { NextResponse } from 'next/server';

export async function GET() {
    // SECURITY: Prevent information disclosure.
    // Do not expose env variables like NODE_ENV or API key presence in public health endpoints.
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
}
