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

## 2026-06-05 - Waveform Generation Downsampling

**Bottleneck:** Rendering the audio waveform from a raw `AudioBuffer` by calculating block averages can block the main thread for several seconds on very large audio files, as the algorithm iterated through `O(N)` samples (where `N` can be millions of elements for a 1-hour audio file).
**Learning:** For visual representations like waveforms with limited pixels (~200 bars), iterating over every single audio sample provides no additional visual fidelity but wastes CPU cycles. Subsampling/downsampling the audio buffer provides identical visual results while bounding execution time to `O(1)` relative to the audio length.
**Action:** Implemented a `stepSize` based on `blockSize` to cap iterations to ~100 per block, reducing processing time for a 10-minute buffer from ~85ms to ~5ms.
**Code:**
```typescript
const stepSize = Math.max(1, Math.floor(blockSize / 100));
for (let j = 0; j < blockSize; j += stepSize) {
    sum += Math.abs(channelData[blockStart + j]);
    count++;
}
```
