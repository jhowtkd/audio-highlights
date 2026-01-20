
import { performance } from 'perf_hooks';

interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

// Inefficient implementation (from task description)
function extractTranscriptLegacy(
  segments: TranscriptionSegment[],
  startTime: number,
  endTime: number
): string {
  return segments
    .filter((s) =>
      (s.start >= startTime && s.start < endTime) ||
      (s.end > startTime && s.end <= endTime) ||
      (s.start <= startTime && s.end >= endTime)
    )
    .map((s) => s.text)
    .join(' ');
}

// BisectLeft helper
function bisectLeft(segments: TranscriptionSegment[], time: number): number {
  let low = 0;
  let high = segments.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (segments[mid].start < time) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}

// Optimized implementation (current codebase state)
function extractTranscriptOptimized(
  segments: TranscriptionSegment[],
  startTime: number,
  endTime: number
): string {
  if (segments.length === 0) return '';

  const endIndex = bisectLeft(segments, endTime);
  const startIndex = bisectLeft(segments, startTime);
  const resultSegments: TranscriptionSegment[] = [];
  const SAFE_LOOKBACK_WINDOW = 600;

  for (let i = startIndex - 1; i >= 0; i--) {
    const s = segments[i];
    if (s.end > startTime) {
      resultSegments.unshift(s);
    }
    if (startTime - s.start > SAFE_LOOKBACK_WINDOW) {
      break;
    }
  }

  for (let i = startIndex; i < endIndex; i++) {
    resultSegments.push(segments[i]);
  }

  return resultSegments
    .map((s) => s.text)
    .join(' ');
}

// Direct String implementation (avoids object array allocation)
function extractTranscriptDirectString(
  segments: TranscriptionSegment[],
  startTime: number,
  endTime: number
): string {
  if (segments.length === 0) return '';

  const endIndex = bisectLeft(segments, endTime);
  const startIndex = bisectLeft(segments, startTime);

  const texts: string[] = [];
  const SAFE_LOOKBACK_WINDOW = 600;

  const prefixTexts: string[] = [];

  for (let i = startIndex - 1; i >= 0; i--) {
    const s = segments[i];
    if (s.end > startTime) {
      prefixTexts.push(s.text);
    }
    if (startTime - s.start > SAFE_LOOKBACK_WINDOW) {
      break;
    }
  }

  // Add prefix texts in correct order (reverse of collection)
  for (let i = prefixTexts.length - 1; i >= 0; i--) {
      texts.push(prefixTexts[i]);
  }

  // Forward scan
  for (let i = startIndex; i < endIndex; i++) {
    texts.push(segments[i].text);
  }

  return texts.join(' ');
}


// Generator
function generateSegments(count: number): TranscriptionSegment[] {
  const segments: TranscriptionSegment[] = [];
  let currentTime = 0;
  for (let i = 0; i < count; i++) {
    const duration = 2 + Math.random() * 8; // 2-10 seconds
    const gap = Math.random() * 0.5; // 0-0.5s gap
    segments.push({
      id: `seg-${i}`,
      start: currentTime,
      end: currentTime + duration,
      text: `Segment text ${i} with some content.`
    });
    currentTime += duration + gap;
  }
  return segments;
}

// Benchmark
function runBenchmark() {
  const segmentCount = 100000; // ~100-200 hours of audio
  console.log(`Generating ${segmentCount} segments...`);
  const segments = generateSegments(segmentCount);
  const totalDuration = segments[segments.length - 1].end;
  console.log(`Total duration: ${(totalDuration / 3600).toFixed(2)} hours`);

  const iterations = 5000; // Increased iterations
  const queries: [number, number][] = [];
  for (let i = 0; i < iterations; i++) {
    const start = Math.random() * (totalDuration - 60);
    const duration = 10 + Math.random() * 110;
    queries.push([start, start + duration]);
  }

  console.log(`Running ${iterations} queries...`);

  // Legacy
  const startLegacy = performance.now();
  // Reduce legacy iterations or it will take too long
  const legacyIterations = 100;
  for (let i = 0; i < legacyIterations; i++) {
     const [s, e] = queries[i];
     extractTranscriptLegacy(segments, s, e);
  }
  const endLegacy = performance.now();
  const timeLegacy = (endLegacy - startLegacy) * (iterations / legacyIterations); // Extrapolate

  // Optimized (Current)
  const startOpt = performance.now();
  for (const [s, e] of queries) {
    extractTranscriptOptimized(segments, s, e);
  }
  const endOpt = performance.now();
  const timeOpt = endOpt - startOpt;

  // Direct String
  const startDirect = performance.now();
  for (const [s, e] of queries) {
    extractTranscriptDirectString(segments, s, e);
  }
  const endDirect = performance.now();
  const timeDirect = endDirect - startDirect;

  console.log(`Legacy Time (Est): ${timeLegacy.toFixed(2)}ms`);
  console.log(`Optimized Time: ${timeOpt.toFixed(2)}ms`);
  console.log(`Direct String Time: ${timeDirect.toFixed(2)}ms`);

  console.log(`Improvement (Legacy -> Optimized): ${(timeLegacy / timeOpt).toFixed(2)}x`);
  console.log(`Improvement (Optimized -> Direct): ${(timeOpt / timeDirect).toFixed(2)}x`);
}

runBenchmark();
