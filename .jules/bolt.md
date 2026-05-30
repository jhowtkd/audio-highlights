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
## 2024-06-18 - Audio Buffer Processing Blocked Main Thread

**Bottleneck:** Rendering the waveform from `Float32Array` audio buffers iteratively processed every single audio sample (`for (let j = 0; j < blockSize; j++)`). For a 5-minute file, this could block the main thread for 50ms-100ms. For a 1-hour file, it could easily lock up the UI for over 600ms during load.
**Learning:** We don't need point-level precision to visually represent 200 bars in a `<canvas>`. We can skip points by calculating a dynamic `step` size relative to the block length while still computing a solid average magnitude.
**Action:** Always sample subsets (e.g. limiting to a maximum of 1,000 samples per UI block) when iterating through huge raw data arrays (like `channelData`) synchronously on the main thread.
**Code:**
```javascript
const maxSamplesPerBlock = 1000;
const step = Math.max(1, Math.floor(blockSize / maxSamplesPerBlock));
const samplesToRead = Math.ceil(blockSize / step);
for (let j = 0; j < blockSize; j += step) {
    sum += Math.abs(channelData[blockStart + j]);
}
filteredData.push(sum / samplesToRead);
```
