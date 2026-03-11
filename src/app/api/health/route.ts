import { NextResponse } from 'next/server';

export async function GET() {
    // SECURITY: Prevent information disclosure of environment configuration
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: {
            groq_configured: !!process.env.GROQ_API_KEY,
        }
    });
}
