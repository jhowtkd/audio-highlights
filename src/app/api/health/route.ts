import { NextResponse } from 'next/server';

export async function GET() {
    // SECURITY: Prevent information disclosure by not exposing environment variables in public endpoint
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
}
