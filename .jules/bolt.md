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

## 2024-06-04 - Waveform Generation Blocking UI Thread

**Bottleneck:** Full decode fallback loop for `channelData` iterates over every sample to compute waveform bars, synchronously blocking the main UI thread during generation for large files (e.g., ~158M samples for an hour-long audio).
**Learning:** Iterating through every sample on the main thread is unnecessary and slow since the target visual resolution is only 200 bars. Subsampling reduces computations significantly without noticeable fidelity loss.
**Action:** When processing large audio buffers for visual rendering, always downsample or subsample the data (e.g., `stepSize`) instead of iterating synchronously through every sample.
**Code:**
```typescript
const stepSize = Math.max(1, Math.floor(blockSize / 100));
let count = 0;

for (let j = 0; j < blockSize; j += stepSize) {
    sum += Math.abs(channelData[blockStart + j]);
    count++;
}
```
