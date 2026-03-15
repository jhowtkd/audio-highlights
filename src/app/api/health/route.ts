import { NextResponse } from 'next/server';

export async function GET() {
    // SECURITY: Prevent information disclosure
    // Do not expose environment configuration details such as NODE_ENV or API key status on public endpoints.
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
}
