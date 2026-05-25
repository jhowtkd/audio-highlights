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

## 2025-02-14 - Waveform Rendering Blocked Main Thread

**Bottleneck:** Iterating over every single sample in the `Float32Array` audio buffer to calculate the waveform blocked the main thread for long audio files.
**Learning:** For waveform visualization, you do not need perfect precision for every audio sample. A dense loop reading millions of samples blocks the UI thread, causing jank.
**Action:** Implemented a step-based sampling method (`const step = Math.max(1, Math.floor(blockSize / 100));`) that limits the loop to process a subset (e.g., 100 points) of data per block, drastically reducing execution time while maintaining visual fidelity.
**Code:**
```typescript
const step = Math.max(1, Math.floor(blockSize / 100));
let sampleCount = 0;
for (let j = 0; j < blockSize; j += step) {
    sum += Math.abs(channelData[blockStart + j]);
    sampleCount++;
}
filteredData.push(sum / sampleCount);
```
