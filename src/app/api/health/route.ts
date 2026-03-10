import { NextResponse } from 'next/server';

export async function GET() {
    // SECURITY: Prevent information disclosure by not exposing environment variables
    // or configuration details (like API keys presence or NODE_ENV) in public endpoints.
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
}
