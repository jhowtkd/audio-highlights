import { performance } from 'perf_hooks';

// Simulate a large number of highlights for the benchmark
const numHighlights = 5000;
const highlights = Array.from({ length: numHighlights }, (_, i) => ({
    id: `id-${i}`,
    title: `Highlight ${i}`,
    startTime: i * 10,
    endTime: i * 10 + 5,
    summary: '',
    duration: 5,
    transcript: '',
    relevanceScore: 1,
    tags: [],
    reasoning: ''
}));

const duration = numHighlights * 10;

// Baseline implementation
function baseline(hoverTime) {
    return highlights.find(
        h => hoverTime >= h.startTime && hoverTime <= h.endTime
    );
}

// Optimized implementation (Binary Search assuming sorted by startTime)
function optimized(hoverTime) {
    let left = 0;
    let right = highlights.length - 1;

    while (left <= right) {
        const mid = (left + right) >> 1;
        const h = highlights[mid];

        if (hoverTime >= h.startTime && hoverTime <= h.endTime) {
            return h;
        }

        if (hoverTime < h.startTime) {
            right = mid - 1;
        } else {
            // hoverTime > h.endTime or hoverTime is between mid's endTime and next start time
            // Since hoverTime > h.startTime, but NOT <= h.endTime, it must be > h.endTime.
            // And since they are sorted by startTime, the next ones will have greater startTimes.
            left = mid + 1;
        }
    }
    return undefined;
}

// Test correctness
console.log('Testing correctness...');
let correct = true;
for (let i = 0; i < 100; i++) {
    const t = Math.random() * duration;
    const b = baseline(t);
    const o = optimized(t);
    if (b !== o) {
        console.error(`Mismatch at time ${t}: baseline=${b?.id}, optimized=${o?.id}`);
        correct = false;
        break;
    }
}
if (correct) {
    console.log('Correctness: OK');
}

// Benchmark
const numTests = 100000;
const testTimes = Array.from({ length: numTests }, () => Math.random() * duration);

let start = performance.now();
for (let i = 0; i < numTests; i++) {
    baseline(testTimes[i]);
}
const baselineTime = performance.now() - start;

start = performance.now();
for (let i = 0; i < numTests; i++) {
    optimized(testTimes[i]);
}
const optimizedTime = performance.now() - start;

console.log(`Baseline time: ${baselineTime.toFixed(2)} ms`);
console.log(`Optimized time: ${optimizedTime.toFixed(2)} ms`);
console.log(`Improvement: ${(baselineTime / optimizedTime).toFixed(2)}x faster`);
