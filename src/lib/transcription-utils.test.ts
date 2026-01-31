
import { describe, it, expect } from 'vitest';
import { alignWordsToSegments, findActiveSegmentIndex } from './transcription-utils';
import type { WhisperSegment, WhisperWord } from '@/types/api';

describe('alignWordsToSegments', () => {
  it('should align words correctly to segments', () => {
    const segments: WhisperSegment[] = [
      { start: 0, end: 2, text: 'Hello world' },
      { start: 2, end: 4, text: 'This is a test' }
    ];

    const words: WhisperWord[] = [
      { start: 0.1, end: 0.5, word: 'Hello' },
      { start: 0.6, end: 1.0, word: 'world' },
      { start: 2.1, end: 2.5, word: 'This' },
      { start: 2.6, end: 3.0, word: 'is' },
      { start: 3.1, end: 3.5, word: 'a' },
      { start: 3.6, end: 3.9, word: 'test' }
    ];

    const result = alignWordsToSegments(segments, words);

    expect(result).toHaveLength(2);
    expect(result[0].words).toHaveLength(2);
    expect(result[0].words[0].word).toBe('Hello');
    expect(result[0].words[1].word).toBe('world');
    expect(result[1].words).toHaveLength(4);
    expect(result[1].words[0].word).toBe('This');
    expect(result[1].words[3].word).toBe('test');
  });

  it('should handle empty words', () => {
    const segments: WhisperSegment[] = [{ start: 0, end: 2, text: 'Hello' }];
    const words: WhisperWord[] = [];
    const result = alignWordsToSegments(segments, words);
    expect(result[0].words).toHaveLength(0);
  });

  it('should handle disjoint segments and words correctly', () => {
      // Word starts before segment but ends inside? (Should include)
      // Word starts inside segment but ends after? (Usually exclude if strict containment, but code allows end <= segment.end)
      // Code: if (word.end <= segment.end) and if (word.start >= segment.start)

      const segments = [{ start: 10, end: 20, text: 'S1' }];
      const words = [
          { start: 9, end: 11, word: 'Before' }, // Overlap start
          { start: 10, end: 11, word: 'Inside' }, // Fully inside
          { start: 19, end: 21, word: 'After' }   // Overlap end
      ];

      const result = alignWordsToSegments(segments, words);
      expect(result[0].words).toHaveLength(1);
      expect(result[0].words[0].word).toBe('Inside');
  });

  it('should be efficient on large inputs', () => {
      // This is just a functional test, performance is benchmarked elsewhere
      const count = 1000;
      const segments: WhisperSegment[] = [];
      const words: WhisperWord[] = [];
      for(let i=0; i<count; i++) {
          segments.push({ start: i, end: i+0.9, text: `S${i}`});
          words.push({ start: i+0.1, end: i+0.2, word: `W${i}`});
      }
      const start = performance.now();
      const result = alignWordsToSegments(segments, words);
      const end = performance.now();
      expect(result).toHaveLength(count);
      expect(end - start).toBeLessThan(100); // Should be very fast
  });
});

describe('findActiveSegmentIndex', () => {
    const segments = [
        { start: 0, end: 5 },
        { start: 5, end: 10 },
        { start: 10, end: 15 }
    ];

    it('should find active segment correctly', () => {
        expect(findActiveSegmentIndex(segments, 0)).toBe(0);
        expect(findActiveSegmentIndex(segments, 2.5)).toBe(0);
        expect(findActiveSegmentIndex(segments, 5)).toBe(1);
        expect(findActiveSegmentIndex(segments, 10)).toBe(2);
    });

    it('should return -1 if time is out of range', () => {
        expect(findActiveSegmentIndex(segments, -1)).toBe(-1);
        expect(findActiveSegmentIndex(segments, 15)).toBe(-1);
        expect(findActiveSegmentIndex(segments, 20)).toBe(-1);
    });

    it('should handle gaps', () => {
        const gapSegments = [
            { start: 0, end: 5 },
            // gap 5-6
            { start: 6, end: 10 }
        ];
        expect(findActiveSegmentIndex(gapSegments, 5.5)).toBe(-1);
    });
});
