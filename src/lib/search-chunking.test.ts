import { describe, it, expect } from 'vitest';
import { groupSegmentsByTokenCount, estimateTokens, SearchSegment } from './search-chunking';

describe('search-chunking', () => {
    const createSegment = (id: string, text: string): SearchSegment => ({
        id,
        start: 0,
        end: 1,
        text
    });

    it('should estimate tokens correctly', () => {
        // "Hello" = 5 chars. 5 / 3.5 = 1.42 -> ceil 2
        expect(estimateTokens('Hello')).toBe(2);
        // Empty
        expect(estimateTokens('')).toBe(0);
    });

    it('should handle empty segments list', () => {
        const result = groupSegmentsByTokenCount([], 1000);
        expect(result).toEqual([]);
    });

    it('should group segments into a single chunk if they fit', () => {
        const segments = [
            createSegment('1', 'Short text'),
            createSegment('2', 'Another short text')
        ];
        // "Short text" (10 chars) -> ~3 tokens + 5 overhead = 8
        // "Another short text" (18 chars) -> ~6 tokens + 5 overhead = 11
        // Total ~19. Max 100. Should fit.

        const chunks = groupSegmentsByTokenCount(segments, 100);
        expect(chunks.length).toBe(1);
        expect(chunks[0].data.length).toBe(2);
        expect(chunks[0].offset).toBe(0);
    });

    it('should split segments when they exceed max tokens', () => {
        const segments = [
            createSegment('1', 'A'.repeat(35)), // 35 chars -> 10 tokens + 5 = 15
            createSegment('2', 'B'.repeat(35)), // 15
            createSegment('3', 'C'.repeat(35))  // 15
        ];

        // Limit 20.
        // Chunk 1: Seg 1 (15). Next is Seg 2 (15). 15+15=30 > 20.
        // So Seg 1 in Chunk 1.
        // Chunk 2: Seg 2 (15). Next is Seg 3 (15). 15+15=30 > 20.
        // So Seg 2 in Chunk 2.
        // Chunk 3: Seg 3.

        const chunks = groupSegmentsByTokenCount(segments, 20);
        expect(chunks.length).toBe(3);
        expect(chunks[0].data[0].id).toBe('1');
        expect(chunks[1].data[0].id).toBe('2');
        expect(chunks[2].data[0].id).toBe('3');
        expect(chunks[1].offset).toBe(1);
    });

    it('should pack as many as possible', () => {
         const segments = [
            createSegment('1', 'A'.repeat(10)), // ~3+5 = 8
            createSegment('2', 'B'.repeat(10)), // 8
            createSegment('3', 'C'.repeat(100)) // ~29+5 = 34
        ];
        // Limit 20.
        // Seg 1 (8).
        // Seg 2 (8). Total 16.
        // Seg 3 (34). Total 50 > 20.
        // Chunk 1: [Seg 1, Seg 2]
        // Chunk 2: [Seg 3]

        const chunks = groupSegmentsByTokenCount(segments, 20);
        expect(chunks.length).toBe(2);
        expect(chunks[0].data.length).toBe(2);
        expect(chunks[1].data.length).toBe(1);
    });

    it('should handle a single segment larger than max tokens by putting it in its own chunk', () => {
        const segments = [
            createSegment('1', 'A'.repeat(350)) // 100 tokens + 5 = 105
        ];
        // Limit 50.
        // It should still process it (we don't split single segments in this implementation, just force new chunk).

        const chunks = groupSegmentsByTokenCount(segments, 50);
        expect(chunks.length).toBe(1);
        expect(chunks[0].data.length).toBe(1);
    });
});
