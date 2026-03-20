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

## 2026-03-20 - Downsampled Audio Waveform Generation Prevents Main Thread Freeze

**Bottleneck:** Rendering the waveform of large audio files (e.g., 1 hour) by iterating over all sample blocks using an exhaustive loop blocks the main thread, causing severe UI freezes (taking >500ms).
**Learning:** For rendering dense data on small canvases, computing the average of every single sample is excessive. Downsampling the data processing loop (e.g., using a computed step size) drastically reduces iteration count while maintaining identical visual output. Additionally, optimizing math operations in tight loops (e.g., replacing `Math.floor` with `~~`, `Math.max` and `Math.abs` with inline evaluations, and mapping divisions with inverse multiplication) yields huge performance gains.
**Action:** When manually parsing and rendering large binary datasets (like audio buffers or large image data) in JS, explicitly downsample your read loop based on the required output resolution, and convert standard math methods to fast inline equivalents for tight processing loops.
**Code:**
```typescript
const blockSize = ~~(channelData.length / samples);
const stepSize = Math.ceil(blockSize / 100) || 1;

for (let j = 0; j < blockSize; j += stepSize) {
    const val = channelData[blockStart + j];
    sum += val < 0 ? -val : val; // Inline Math.abs
    count++;
}
```
