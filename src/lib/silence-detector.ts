import { v4 as uuidv4 } from 'uuid';
import type { WordTimestamp } from '@/types';
import type { DecupageSegment } from '@/types/decupagem';

/**
 * Detects silences in a transcript by analyzing gaps between word timestamps.
 * 
 * @param words List or iterable of word timestamps from the transcription
 * @param thresholdMs Minimum duration in milliseconds to consider a gap as silence (default: 2000ms)
 * @returns List of DecupageSegments representing detected silences
 */
export function detectSilences(
    words: Iterable<WordTimestamp>,
    thresholdMs: number = 2000
): DecupageSegment[] {
    if (!words) {
        return [];
    }

    const silences: DecupageSegment[] = [];
    const thresholdSec = thresholdMs / 1000;

    let previousWord: WordTimestamp | null = null;

    for (const currentWord of words) {
        if (previousWord) {
            // Check gap between end of previous word and start of current word
            const gapDuration = currentWord.start - previousWord.end;

            if (gapDuration >= thresholdSec) {
                silences.push({
                    id: uuidv4(),
                    startTime: previousWord.end,
                    endTime: currentWord.start,
                    text: '[SILÊNCIO]',
                    problemType: 'silence',
                    severity: 'high',
                    suggestion: 'cut',
                    reason: `Silêncio detectado de ${gapDuration.toFixed(1)}s`,
                    status: 'pending' // Default to pending so user can review, or we could default to 'cut'
                });
            }
        }
        previousWord = currentWord;
    }

    return silences;
}
