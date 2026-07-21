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

## 2026-07-21 - Premature Memoization on High Frequency Props

**Bottleneck:** Unnecessary component re-renders.
**Learning:** Applying `React.memo` to a component driven by a high-frequency prop (like `currentTime` from an AudioPlayer updating at 60hz) without verifying the parent's rendering behavior pessimizes performance rather than optimizing it, because the shallow prop comparison will return false, causing the component to re-render anyway.
**Action:** Do not use `React.memo` on components that receive continuously updating props.
**Code:** N/A

## 2026-07-21 - Waveform Striding Optimization

**Bottleneck:** O(N) iteration over entire audio buffer (`getChannelData`) during waveform generation freezes main thread for long audio files (millions of samples).
**Learning:** For visualizations with limited pixel width, iterating every sample is unnecessary. Downsampling (striding) limits the number of operations required per block.
**Action:** Implemented striding using `step = Math.max(1, Math.floor(blockSize / MAX_SAMPLES_PER_BLOCK))` to ensure O(1) processing per block (max 100 samples per block) regardless of the audio file's duration.
**Code:**
```typescript
const MAX_SAMPLES_PER_BLOCK = 100;
const step = Math.max(1, Math.floor(blockSize / MAX_SAMPLES_PER_BLOCK));
for (let j = 0; j < blockSize; j += step) {
    sum += Math.abs(channelData[blockStart + j]);
    count++;
}
```
