import type { WhisperSegment, WhisperWord } from '@/types/api';

/**
 * Aligns words to segments efficiently (O(N+M)) assuming both are sorted by start time.
 * This optimization avoids the O(N*M) nested loop performance bottleneck.
 *
 * @param segments List of transcription segments (must be sorted by start time)
 * @param words List of transcription words (must be sorted by start time)
 * @returns Array of objects containing the original segment and its matching words
 */
export function alignWordsToSegments(
  segments: WhisperSegment[],
  words: WhisperWord[]
): { segment: WhisperSegment; words: WhisperWord[] }[] {
  const allWords = words || [];
  let currentWordIndex = 0;

  return (segments || []).map((segment) => {
    // Skip words that are before this segment
    // Since words are sorted, we can maintain a pointer (currentWordIndex)
    // and never look back, ensuring O(N+M) complexity.
    while (
      currentWordIndex < allWords.length &&
      allWords[currentWordIndex].start < segment.start
    ) {
      currentWordIndex++;
    }

    const segmentWords: WhisperWord[] = [];
    let tempIndex = currentWordIndex;

    // Collect words within the segment
    while (tempIndex < allWords.length) {
      const word = allWords[tempIndex];

      // If the word starts after the segment ends, we can stop searching for this segment
      // because subsequent words will also be outside (due to sorting).
      if (word.start > segment.end) {
        break;
      }

      // Check if the word ends within the segment
      if (word.end <= segment.end) {
        // We already know word.start >= segment.start from the initial skip loop
        // (or it's a subsequent word in sorted order)
        if (word.start >= segment.start) {
          segmentWords.push(word);
        }
      }
      tempIndex++;
    }

    return {
      segment,
      words: segmentWords
    };
  });
}

/**
 * Binary search to find the active segment index efficiently.
 *
 * @param segments List of segments sorted by start time
 * @param currentTime Current playback time in seconds
 * @returns Index of the active segment or -1 if none found
 */
export function findActiveSegmentIndex(
  segments: { start: number; end: number }[],
  currentTime: number
): number {
  let low = 0;
  let high = segments.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const segment = segments[mid];

    if (currentTime >= segment.start && currentTime < segment.end) {
      return mid;
    } else if (currentTime < segment.start) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return -1;
}
