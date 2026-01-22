import { Segment } from '@/app/api/search/route'; // Or define a compatible interface here to avoid circular deps if needed.
// Actually, it's better to define the interface here and use it.

export interface SearchSegment {
    id: string;
    start: number;
    end: number;
    text: string;
}

export interface Chunk {
    offset: number;
    data: SearchSegment[];
}

/**
 * Estimates the number of tokens in a text string.
 * Uses a conservative estimate of 3.5 characters per token.
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 3.5);
}

/**
 * Groups segments into chunks based on a maximum token limit.
 * This optimizes API calls by packing as many segments as possible into the context window.
 *
 * @param segments List of segments to group
 * @param maxTokens Maximum estimated tokens per chunk (default: 8000)
 * @returns Array of chunks
 */
export function groupSegmentsByTokenCount(
    segments: SearchSegment[],
    maxTokens: number = 8000
): Chunk[] {
    if (segments.length === 0) {
        return [];
    }

    const chunks: Chunk[] = [];
    let currentChunkSegments: SearchSegment[] = [];
    let currentChunkTokenCount = 0;
    let chunkStartIndex = 0;

    // Overhead for prompt instruction per segment: `[index] ` -> approx 3-4 tokens
    const PER_SEGMENT_OVERHEAD = 5;

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const segmentTokens = estimateTokens(segment.text) + PER_SEGMENT_OVERHEAD;

        // If adding this segment exceeds the limit and we have segments in the current chunk,
        // push the current chunk and start a new one.
        if (currentChunkTokenCount + segmentTokens > maxTokens && currentChunkSegments.length > 0) {
            chunks.push({
                offset: chunkStartIndex,
                data: currentChunkSegments
            });

            currentChunkSegments = [];
            currentChunkTokenCount = 0;
            chunkStartIndex = i;
        }

        currentChunkSegments.push(segment);
        currentChunkTokenCount += segmentTokens;
    }

    // Push the last chunk if it has segments
    if (currentChunkSegments.length > 0) {
        chunks.push({
            offset: chunkStartIndex,
            data: currentChunkSegments
        });
    }

    return chunks;
}
