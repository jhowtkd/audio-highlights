import { v4 as uuidv4 } from 'uuid';
import type { WordTimestamp } from '@/types';
import type { DecupageSegment } from '@/types/decupagem';

/**
 * Detects silences in a transcript by analyzing gaps between word timestamps.
 * 
 * @param words List of word timestamps from the transcription
 * @param thresholdMs Minimum duration in milliseconds to consider a gap as silence (default: 2000ms)
 * @returns List of DecupageSegments representing detected silences
 */
export function detectSilences(
    words: WordTimestamp[],
    thresholdMs: number = 2000
): DecupageSegment[] {
    if (!words || words.length < 2) {
        return [];
    }

    const silences: DecupageSegment[] = [];
    const thresholdSec = thresholdMs / 1000;

    for (let i = 0; i < words.length - 1; i++) {
        const currentWord = words[i];
        const nextWord = words[i + 1];

        // Check gap between end of current word and start of next word
        const gapDuration = nextWord.start - currentWord.end;

        if (gapDuration >= thresholdSec) {
            silences.push({
                id: uuidv4(),
                startTime: currentWord.end,
                endTime: nextWord.start,
                text: '[SILÊNCIO]',
                problemType: 'silence',
                severity: 'high',
                suggestion: 'cut',
                reason: `Silêncio detectado de ${gapDuration.toFixed(1)}s`,
                status: 'pending' // Default to pending so user can review, or we could default to 'cut'
            });
        }
    }

    return silences;
}
