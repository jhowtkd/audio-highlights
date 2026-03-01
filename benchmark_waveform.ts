const NUM_SEGMENTS = 10000;
const DURATION = 3600; // 1 hour audio
const SAMPLES = 200;
const BUCKET_SIZE = DURATION / SAMPLES;

interface Segment {
    start: number;
    end: number;
}

const segments: Segment[] = [];
for (let i = 0; i < NUM_SEGMENTS; i++) {
    const start = Math.random() * (DURATION - 10);
    const end = start + Math.random() * 10;
    segments.push({ start, end });
}

function testOriginal() {
    const data = new Array(SAMPLES).fill(0);
    segments.forEach(segment => {
        const startBucket = Math.floor(segment.start / BUCKET_SIZE);
        const endBucket = Math.floor(segment.end / BUCKET_SIZE);

        for (let i = Math.max(0, startBucket); i <= Math.min(SAMPLES - 1, endBucket); i++) {
            data[i] += 1;
        }
    });
    return data;
}

function testOptimized() {
    const data = new Array(SAMPLES).fill(0);
    const SAMPLES_MINUS_ONE = SAMPLES - 1;
    segments.forEach(segment => {
        const startBucket = Math.floor(segment.start / BUCKET_SIZE);
        const endBucket = Math.floor(segment.end / BUCKET_SIZE);

        const startIdx = Math.max(0, startBucket);
        const endIdx = Math.min(SAMPLES_MINUS_ONE, endBucket);

        for (let i = startIdx; i <= endIdx; i++) {
            data[i] += 1;
        }
    });
    return data;
}

// Warmup
for (let i = 0; i < 1000; i++) {
    testOriginal();
    testOptimized();
}

const ITERATIONS = 5000;

console.time('Original');
for (let i = 0; i < ITERATIONS; i++) {
    testOriginal();
}
console.timeEnd('Original');

console.time('Optimized');
for (let i = 0; i < ITERATIONS; i++) {
    testOptimized();
}
console.timeEnd('Optimized');
