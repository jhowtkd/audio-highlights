import { NextResponse } from 'next/server';

export async function GET() {
    // SECURITY: Prevent information disclosure. Do not expose environment variables
    // or internal configuration state in public health endpoints.
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
}
