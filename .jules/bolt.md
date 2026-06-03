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
## 2026-06-03 - Waveform Generation Blocked UI Thread

**Bottleneck:** Rendering the waveform for large audio files blocked the main UI thread during audio decoding/visualization, taking ~500ms to process a 1-hour audio block on the main thread because it iterated synchronously over ~800k samples per frame/block.
**Learning:** Iterating through raw audio data point-by-point via `AudioBuffer.getChannelData` blocks the main UI thread. It is completely unnecessary to visualize at this granularity.
**Action:** Subsample the audio buffer when processing long audio segments for UI rendering. Specifically, dynamically calculate a `stepSize` to sample up to ~100 points per block, dropping execution time to ~3ms while keeping visually similar results.
**Code:**
```typescript
const stepSize = Math.max(1, Math.floor(blockSize / 100));
let count = 0;
for (let j = 0; j < blockSize; j += stepSize) {
    sum += Math.abs(channelData[blockStart + j]);
    count++;
}
filteredData.push(sum / count);
```
