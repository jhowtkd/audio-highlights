import { NextResponse } from 'next/server';

export async function GET() {
    // SECURITY: Prevent information disclosure by not exposing environment details in public endpoints.
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
}
