import { NextResponse } from 'next/server';

export async function GET() {
    // SECURITY: Removed env disclosure to prevent information leakage
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
}
