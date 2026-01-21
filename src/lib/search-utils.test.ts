import { describe, it, expect } from 'vitest';
import { calculateLocalRelevance, escapeRegExp } from './search-utils';

describe('search-utils', () => {
    describe('escapeRegExp', () => {
        it('should escape special regex characters', () => {
            expect(escapeRegExp('hello.world')).toBe('hello\\.world');
            expect(escapeRegExp('(hello)')).toBe('\\(hello\\)');
        });
    });

    describe('calculateLocalRelevance', () => {
        const segments = [
            { id: '1', start: 0, end: 1, text: 'The quick brown fox' },
            { id: '2', start: 1, end: 2, text: 'jumps over the lazy dog' },
            { id: '3', start: 2, end: 3, text: 'The fox is quick' }
        ];

        it('should return 0 for empty query', () => {
            expect(calculateLocalRelevance(segments, '')).toBe(0);
        });

        it('should return 0 for short query words', () => {
            expect(calculateLocalRelevance(segments, 'a is')).toBe(0); // 'is' is stop word or len 2, 'a' is length 1
        });

        it('should ignore common stop words', () => {
             // "the" is a stop word. "quick" is not.
            expect(calculateLocalRelevance(segments, 'the quick')).toBe(2);
        });

        it('should count occurrences of keywords with word boundaries', () => {
            // 'fox' appears 2 times
            expect(calculateLocalRelevance(segments, 'fox')).toBe(2);
            // 'quick' appears 2 times
            expect(calculateLocalRelevance(segments, 'quick')).toBe(2);
        });

        it('should NOT match substrings (e.g. "qui" in "quick")', () => {
            expect(calculateLocalRelevance(segments, 'qui')).toBe(0);
        });

        it('should NOT match substrings (e.g. "act" in "action")', () => {
            const segmentsAction = [{ id: '1', start: 0, end: 1, text: 'Take action now' }];
            expect(calculateLocalRelevance(segmentsAction, 'act')).toBe(0);
        });

        it('should match words with punctuation if boundary allows', () => {
             const segmentsPunct = [{ id: '1', start: 0, end: 1, text: 'Hello, world!' }];
             expect(calculateLocalRelevance(segmentsPunct, 'world')).toBe(1);
        });

        it('should be case insensitive', () => {
            expect(calculateLocalRelevance(segments, 'FOX')).toBe(2);
        });
    });
});
