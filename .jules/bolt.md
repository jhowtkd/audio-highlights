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

## 2026-02-06 - Optimized Waveform Generation Main Thread Blocking

**Bottleneck:** Rendering waveforms from large audio files was blocking the main thread because the processing loops over every sample in the `Float32Array` audio buffer. With a large array size and multiple samples, this causes UI lag or browser freezes.
**Learning:** Iterating over every single sample in large Float32Arrays blocks the main JS thread synchronously. We don't need a high-resolution analysis of every single frame for a simple visualization—sampling a small subset of points is visually indistinguishable and significantly faster.
**Action:** When calculating waveform blocks from raw audio buffer data, calculate a step size to only sample a subset of data points per block (e.g., maximum 100 samples per block) instead of every point.
**Code:**
```typescript
const maxSamplesPerBlock = 100;
const step = Math.max(1, Math.floor(blockSize / maxSamplesPerBlock));

for (let i = 0; i < samples; i++) {
    const blockStart = blockSize * i;
    let sum = 0;
    let count = 0;

    for (let j = 0; j < blockSize; j += step) {
        sum += Math.abs(channelData[blockStart + j]);
        count++;
    }

    filteredData.push(sum / count);
}
```
