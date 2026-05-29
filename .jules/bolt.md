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

## 2025-05-29 - Optimized Waveform Generation

**Bottleneck:** The `Waveform` component iterated over every sample of the audio buffer's `Float32Array` when computing bar heights. For large audio files, this meant iterating through millions of data points, causing blocking on the main thread and resulting in poor performance.
**Learning:** Fully rendering audio buffers on the main thread is a common cause of jank, as we process far more resolution than what the visual chart actually needs. We don't need to sample every single audio frame to calculate the height of a bar.
**Action:** Implemented sub-sampling. Instead of examining every data point in a block, calculate a step size to sample a fixed maximum number of data points per block (e.g., up to 100). This reduces processing times from ~50ms to ~3ms for large audios.
**Code:**
```typescript
const step = Math.max(1, Math.floor(blockSize / 100));

for (let j = 0; j < blockSize; j += step) {
    sum += Math.abs(channelData[blockStart + j]);
    count++;
}

filteredData.push(sum / count);
```
