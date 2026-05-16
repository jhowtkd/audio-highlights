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

## 2024-05-16 - Audio Chunking Iterator and Array Resizing Overhead

**Bottleneck:** High latency and potential memory pressure during the timestamp adjustment and result merging phases for large audio files containing thousands of transcription segments and words.
**Learning:** Using `for...of` loops introduces iterator overhead in the V8 engine, which accumulates significantly in performance-critical code paths iterating over massive datasets. Similarly, iteratively pushing to a dynamic array (via `reduce` + `push`) causes frequent re-allocations and copying of the underlying memory buffer as the array grows.
**Action:** Replace `for...of` loops with classic index-based `for` loops in hot paths (like `transcriber`). Pre-calculate the total required size and pre-allocate the final array (`new Array(totalSegmentsCount)`) before populating it to eliminate dynamic resizing overhead during array merging.
**Code:**
```typescript
// Pre-calculate and pre-allocate
let totalSegmentsCount = 0;
for (let i = 0; i < results.length; i++) {
    totalSegmentsCount += results[i].segments.length;
}
const allSegments = new Array<TranscriptionSegment>(totalSegmentsCount);
let currentSegmentIndex = 0;
for (let i = 0; i < results.length; i++) {
    for (let j = 0; j < results[i].segments.length; j++) {
        allSegments[currentSegmentIndex++] = results[i].segments[j];
    }
}
```
