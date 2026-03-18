import { NextResponse } from 'next/server';

export async function GET() {
    // SECURITY: Prevent information disclosure by not exposing environment variables like NODE_ENV or API keys
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
}
