## 2025-01-31 - High Frequency Audio Updates Optimization

**Bottleneck:** `AudioPlayer` updates `currentTime` at 60Hz. This state was lifted to `TaskDetailPage` to coordinate `Waveform` and `TranscriptViewer`. This caused the entire `TaskDetailPage` and all children (ConfigPanel, Highlights, etc.) to re-render 60 times/second.

**Learning:** `React.memo` is critical when a parent component manages high-frequency state (like audio playback time) but passes it to children that don't need it or can compute derived state cheaply.

**Action:**
1. Memoized heavy static components (`ConfigPanel`, `HighlightList`, `DecupagemView`).
2. Decoupled `TranscriptViewer` from `currentTime` by calculating `activeSegmentIndex` in the parent and passing that stable value (which changes rarely) instead of the rapidly changing `currentTime`.

**Code:**
```typescript
// Parent calculates the stable index
const activeSegmentIndex = useMemo(() => {
    return findActiveSegmentIndex(segments, currentTime);
}, [segments, currentTime]);

// Child only updates when index changes
<TranscriptViewer activeSegmentIndex={activeSegmentIndex} ... />
```

## 2026-02-05 - Replaced Manual Chunking with Virtualization

**Bottleneck:** `TranscriptViewer` used a "manual chunking" strategy (rendering chunks of 50 segments) which still resulted in O(N) DOM nodes, causing heavy initial rendering and memory usage for long transcripts.
**Learning:** Manual chunking reduces reconciliation cost slightly but does not solve DOM weight issues. Virtualization is required for scalability.
**Action:** Replaced `TranscriptChunk` manual logic with `react-virtuoso`.
**Code:**
```typescript
// Removed: chunkIndices.map(...) -> <TranscriptChunk />
// Added:
<Virtuoso
  data={segments}
  itemContent={(index, segment) => <TranscriptSegment ... />}
/>
```

## 2026-03-13 - Optimizing Waveform Audio Decoding loops

**Bottleneck:** Rendering the waveform iterates over the whole `AudioBuffer` block twice, calculates `Math.abs`, does array unrolling to find `Math.max` and uses `Array.map` to normalize the array.
**Learning:** Found several performance opportunities in `src/components/audio/waveform.tsx`: Math.abs on typed arrays natively is surprisingly faster than inline ternary, however mapping inline and avoiding the unrolling of the `Math.max` inside `Math.max(...filteredData)` avoids maximum call stack size limits on large typed arrays and brings the execution time significantly down. Moreover, preallocating the array using `new Array(size)` saves allocations over time.
**Action:** In loops over large float buffers/arrays, avoid spreading the array `...array` in functions like `Math.max()`. Also prefer preallocating arrays and setting indexes directly instead of pushing to an empty array.
**Code:**
```typescript
const filteredData = new Array(samples);
let multiplier = 0;

for (let i = 0; i < samples; i++) {
    // ... loop calculations ...
    const avg = sum / blockSize;
    filteredData[i] = avg;
    if (avg > multiplier) multiplier = avg;
}

const normalizedData = new Array(samples);
const invMultiplier = multiplier > 0 ? 1 / multiplier : 1;
for (let i = 0; i < samples; i++) {
    normalizedData[i] = filteredData[i] * invMultiplier;
}
```
