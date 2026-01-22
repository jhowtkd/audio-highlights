import { describe, it, expect } from 'vitest';
import { detectSilences } from './silence-detector';
import type { WordTimestamp } from '@/types';

describe('detectSilences', () => {
    it('should detect silence greater than threshold', () => {
        const words: WordTimestamp[] = [
            { word: 'Hello', start: 0, end: 1 },
            // Gap: 1s to 4s (3s duration)
            { word: 'World', start: 4, end: 5 }
        ];

        const silences = detectSilences(words, 2000); // 2s threshold

        expect(silences).toHaveLength(1);
        expect(silences[0].startTime).toBe(1);
        expect(silences[0].endTime).toBe(4);
        expect(silences[0].problemType).toBe('silence');
        expect(silences[0].suggestion).toBe('cut');
    });

    it('should ignore gaps smaller than threshold', () => {
        const words: WordTimestamp[] = [
            { word: 'Hello', start: 0, end: 1 },
            // Gap: 1s to 2s (1s duration)
            { word: 'World', start: 2, end: 3 }
        ];

        const silences = detectSilences(words, 2000); // 2s threshold

        expect(silences).toHaveLength(0);
    });

    it('should handle empty or single word arrays', () => {
        expect(detectSilences([], 2000)).toHaveLength(0);
        expect(detectSilences([{ word: 'Hi', start: 0, end: 1 }], 2000)).toHaveLength(0);
    });

    it('should detect multiple silences', () => {
        const words: WordTimestamp[] = [
            { word: 'One', start: 0, end: 1 },
            // Silence 1: 3s
            { word: 'Two', start: 4, end: 5 },
            { word: 'Three', start: 5.5, end: 6 },
            // Silence 2: 4s
            { word: 'Four', start: 10, end: 11 }
        ];

        const silences = detectSilences(words, 2000);

        expect(silences).toHaveLength(2);
        expect(silences[0].startTime).toBe(1);
        expect(silences[0].endTime).toBe(4);
        expect(silences[1].startTime).toBe(6);
        expect(silences[1].endTime).toBe(10);
    });
});
