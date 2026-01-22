import { NextRequest, NextResponse } from 'next/server';
import { generateEDL } from '@/lib/edl-generator';
import { createErrorResponse } from '@/lib/errors';
import type { DecupageSegment, EDLFormat } from '@/types/decupagem';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { segments, format, title } = body as {
            segments: DecupageSegment[],
            format: EDLFormat,
            title?: string
        };

        if (!segments || !Array.isArray(segments)) {
            return NextResponse.json({ error: 'Invalid segments data' }, { status: 400 });
        }

        const content = generateEDL(segments, format, {
            title: title || 'Decupagem Export'
        });

        const extension = format === 'csv' ? 'csv' : format === 'fcpxml' ? 'fcpxml' : 'edl';
        const filename = `decupagem-${new Date().getTime()}.${extension}`;

        // Return as downloadable file
        return new NextResponse(content, {
            headers: {
                'Content-Type': format === 'csv' ? 'text/csv' : 'text/plain',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        return createErrorResponse(error, 'EDL Export API');
    }
}
