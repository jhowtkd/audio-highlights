/**
 * Proof of Concept: Merging Whisper words with Speaker Diarization
 */

interface Word { word: string; start: number; end: number; }
interface SpeakerInterval { speaker: string; start: number; end: number; }
interface DiarizedWord extends Word { speaker: string; }

function alignSpeakers(words: Word[], intervals: SpeakerInterval[]): DiarizedWord[] {
  return words.map(word => {
    // Find the interval that overlaps most with this word
    let bestInterval = intervals[0];
    let maxOverlap = 0;

    for (const interval of intervals) {
      const overlapStart = Math.max(word.start, interval.start);
      const overlapEnd = Math.min(word.end, interval.end);
      const overlap = Math.max(0, overlapEnd - overlapStart);

      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        bestInterval = interval;
      }
    }

    // Default to 'Speaker_UNKNOWN' if no overlap found
    return {
      ...word,
      speaker: maxOverlap > 0 ? bestInterval.speaker : 'Speaker_UNKNOWN'
    };
  });
}

// Mock Data
const whisperWords: Word[] = [
  { word: "Hello", start: 0.1, end: 0.5 },
  { word: "world", start: 0.6, end: 1.0 },
  { word: "How", start: 1.5, end: 1.8 },
  { word: "are", start: 1.9, end: 2.1 },
  { word: "you?", start: 2.2, end: 2.5 }
];

const diarizationIntervals: SpeakerInterval[] = [
  { speaker: "Speaker_A", start: 0.0, end: 1.2 },
  { speaker: "Speaker_B", start: 1.4, end: 2.6 }
];

console.log("Original Words:", whisperWords);
console.log("Speaker Intervals:", diarizationIntervals);

const result = alignSpeakers(whisperWords, diarizationIntervals);
console.log("\nDiarized Words:");
console.log(result);
