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

## 2026-07-28 - Optimizing Waveform Generation via Downsampling
**Bottleneck:** The `<Waveform>` component processed every audio sample to render visual blocks. For long audio files at high sample rates (e.g., 48kHz), this meant iterating through millions of elements (e.g., 28.8M samples for a 10-minute file), causing the main UI thread to block for over 100ms and freezing interactions.
**Learning:** For rendering dense visual representations like waveforms, precision beyond screen resolution is wasted work. Limiting the sample read count per pixel/block yields a visually identical graph while dropping computational complexity from $O(N)$ (where $N$ is block size) to $O(1)$.
**Action:** Implemented a striding/downsampling loop with a maximum sample limit (`MAX_SAMPLES_PER_BLOCK = 100`) to guarantee fast, constant-time execution per visual block regardless of the underlying audio length or sample density.
**Code:**
```typescript
const MAX_SAMPLES_PER_BLOCK = 100;
const stride = Math.max(1, Math.floor(blockSize / MAX_SAMPLES_PER_BLOCK));

let sum = 0;
let count = 0;
for (let j = 0; j < blockSize; j += stride) {
    sum += Math.abs(channelData[blockStart + j]);
    count++;
}
filteredData.push(sum / count);
```
