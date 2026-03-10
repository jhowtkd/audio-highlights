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

## 2026-03-10 - Math.abs and Array iteration overhead in tight loops

**Bottleneck:** High CPU usage and slow processing time when generating waveform bars directly from large audio buffers (e.g. hundreds of thousands of samples).
**Learning:** `Math.abs()` and array spread operators like `Math.max(...filteredData)` incur significant performance overhead in high-frequency loops (millions of iterations). Calling the functions has an overhead compared to standard inline operators.
**Action:** Replaced `Math.abs(val)` with an inline ternary conditional `val < 0 ? -val : val`, deferred division operations until after the loops by pre-calculating and adding inside the loop and dividing later, and manually found max values within the loop instead of using `Math.max(...array)` or spread operator that may throw Maximum Call Stack.
**Code:**
```typescript
let maxFiltered = Number.MIN_VALUE;
for (let i = 0; i < samples; i++) {
    const blockStart = blockSize * i;
    let sum = 0;

    for (let j = 0; j < blockSize; j++) {
        const val = channelData[blockStart + j];
        sum += val < 0 ? -val : val; // inline ternary instead of Math.abs
    }

    const avg = sum / blockSize;
    filteredData.push(avg);
    if (avg > maxFiltered) {
        maxFiltered = avg;
    }
}
```
