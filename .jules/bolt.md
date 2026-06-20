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
## 2026-06-20 - Full AudioBuffer Iteration Blocks Main Thread

**Bottleneck:** Rendering waveforms for large audio files caused severe UI freezing due to iterating over every single sample synchronously.
**Learning:** Looping through millions of samples in an AudioBuffer block blocks the main UI thread. High-resolution audio doesn't need pixel-perfect sample checking to render a waveform; subsampling provides visually identical results with negligible cost.
**Action:** Always calculate a `stepSize` when iterating large buffers for visualizations and skip samples (e.g., `for (let j = 0; j < blockSize; j += stepSize)`).
**Code:**
```typescript
const stepSize = Math.max(1, Math.floor(blockSize / 100));
for (let j = 0; j < blockSize; j += stepSize) {
    sum += Math.abs(channelData[blockStart + j]);
    count++;
}
```
