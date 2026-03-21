import { NextResponse } from 'next/server';

export async function GET() {
    // SECURITY: This endpoint is public. Do not expose environment
    // configuration details such as NODE_ENV or the presence of API keys
    // to prevent information disclosure.
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
}
