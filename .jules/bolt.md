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

## 2026-07-27 - Main Thread Blocked by Large Audio Waveform Generation

**Bottleneck:** Iterating over `AudioBuffer` samples in a loop blocked the main thread. Loops `blockSize` times per sample block, which can be millions of operations for long audio.
**Learning:** Downsampling the samples is necessary.
**Action:** By downsampling to a maximum of 100 samples per block, the loop performs at most 100 operations, making it an O(1) complexity per block instead of O(N) operations per block. This is visually identical but significantly improves generation performance and removes UI jank.
**Code:**
```typescript
const MAX_SAMPLES_PER_BLOCK = 100;
const step = Math.max(1, Math.floor(blockSize / MAX_SAMPLES_PER_BLOCK));

for (let j = 0; j < blockSize; j += step) {
    sum += Math.abs(channelData[blockStart + j]);
    count++;
}
```
