import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        // SECURITY: Not exposing internal server state or env variables to prevent information disclosure
    });
}
