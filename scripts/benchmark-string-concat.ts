
import { performance } from 'perf_hooks';

interface TranscriptionSegment {
    id: string;
    start: number;
    end: number;
    text: string;
    words?: any[];
}

interface ChunkResult {
    index: number;
    segments: TranscriptionSegment[];
    fullText: string;
    language?: string;
}

// Generate dummy data
const NUM_CHUNKS = 100;
const SEGMENTS_PER_CHUNK = 50;
const TEXT_PER_SEGMENT = "This is a sample text segment to simulate transcription content. ";

const chunks: ChunkResult[] = [];

for (let i = 0; i < NUM_CHUNKS; i++) {
    const segments: TranscriptionSegment[] = [];
    let chunkText = "";
    for (let j = 0; j < SEGMENTS_PER_CHUNK; j++) {
        const text = TEXT_PER_SEGMENT + Math.random().toString(36).substring(7);
        chunkText += (chunkText ? ' ' : '') + text;
        segments.push({
            id: `chunk-${i}-seg-${j}`,
            start: i * 600 + j * 10,
            end: i * 600 + j * 10 + 9,
            text: text
        });
    }
    chunks.push({
        index: i,
        segments: segments,
        fullText: chunkText,
        language: 'en'
    });
}

console.log(`Generated ${NUM_CHUNKS} chunks with ${SEGMENTS_PER_CHUNK} segments each.`);

// Benchmark 1: Inefficient String Concatenation and Array Spreading (Simulating the "bad" code)
const start1 = performance.now();

let allSegments1: TranscriptionSegment[] = [];
let fullText1 = "";

for (let i = 0; i < chunks.length; i++) {
    const result = chunks[i];

    // Simulate timestamp adjustment overhead (minimal, but present in loop)
    const adjustedSegments = result.segments.map(s => ({ ...s }));

    // Inefficient spreading
    allSegments1 = [...allSegments1, ...adjustedSegments];

    // Inefficient string concatenation
    fullText1 += (fullText1 ? ' ' : '') + result.fullText;
}

const end1 = performance.now();
const time1 = end1 - start1;

// Benchmark 2: Efficient Array methods (Current implementation)
const start2 = performance.now();

// Sort (part of the current implementation)
const sortedChunks = [...chunks].sort((a, b) => a.index - b.index);

// Efficient flatMap
const allSegments2 = sortedChunks.flatMap(r => r.segments.map(s => ({ ...s }))); // mapping just to match overhead

// Efficient join
const fullText2 = sortedChunks.map(r => r.fullText).join(' ');

const end2 = performance.now();
const time2 = end2 - start2;

// Verify correctness
if (allSegments1.length !== allSegments2.length) {
    console.error(`Mismatch in segments count: ${allSegments1.length} vs ${allSegments2.length}`);
}
if (fullText1 !== fullText2) {
    console.error(`Mismatch in fullText length: ${fullText1.length} vs ${fullText2.length}`);
}

console.log(`\nResults:`);
console.log(`1. Inefficient Loop (Concatenation + Spread): ${time1.toFixed(3)} ms`);
console.log(`2. Optimized (flatMap + join):              ${time2.toFixed(3)} ms`);
console.log(`Improvement: ${(time1 / time2).toFixed(2)}x faster`);
