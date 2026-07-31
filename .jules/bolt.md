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

## 2026-02-09 - Waveform Generation Downsampling

**Bottleneck:** `Waveform` fallback logic iterates over every single sample in the `AudioBuffer` to calculate block averages. For large files (e.g., 5 min at 48kHz = 14.4 million samples), this blocks the main UI thread during generation (O(N) operation per block).
**Learning:** For visualizing audio waveforms, evaluating every sample is visually indistinguishable from evaluating a small representative subset, but it is vastly more expensive computationally.
**Action:** Implemented a striding (downsampling) approach in the loop. By calculating a `stride` based on `MAX_POINTS_PER_BLOCK = 100`, the loop reduces operations from O(N) to O(1) per block without sacrificing visual fidelity.
**Code:**
```typescript
const MAX_POINTS_PER_BLOCK = 100;
const stride = Math.max(1, Math.floor(blockSize / MAX_POINTS_PER_BLOCK));

for (let j = 0; j < blockSize; j += stride) {
    sum += Math.abs(channelData[blockStart + j]);
    count++;
}
```
