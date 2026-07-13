import { NextRequest, NextResponse } from 'next/server';
import { generateEDL } from '@/lib/edl-generator';
import { createErrorResponse } from '@/lib/errors';
import { decupageExportRequestSchema } from '@/lib/validations';
import type { DecupageSegment, EDLFormat } from '@/types/decupagem';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // SECURITY: Validate unbounded user input to prevent type confusion and DoS
        const validatedData = decupageExportRequestSchema.parse(body);

        const segments = validatedData.segments as DecupageSegment[];
        const format = validatedData.format as EDLFormat;
        const title = validatedData.title;

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
