import { NextResponse } from 'next/server';

export async function GET() {
    // SECURITY: Prevent information disclosure by not exposing environment configuration
    // such as NODE_ENV or API key presence in public health check endpoints.
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
}
