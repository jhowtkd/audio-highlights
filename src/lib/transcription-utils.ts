import type { WhisperSegment, WhisperWord } from '@/types/api';

/**
 * Aligns words to segments efficiently (O(N+M)) assuming both are sorted by start time.
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
