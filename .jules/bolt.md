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
## 2026-03-05 - Audio Buffer Waveform Rendering Bottleneck

**Bottleneck:** Rendering the waveform from an `AudioBuffer` by iterating through every single sample (`channelData`). For long audio files, this means processing tens of millions of samples on the main thread, causing severe lag, blocking the UI, and risking `Maximum call stack size exceeded` errors due to using `Math.max(...array)`.
**Learning:** You do not need pixel-perfect precision from millions of samples to draw a 200-bar waveform on a canvas. A subset of samples provides an identical visual representation.
**Action:** Implemented adaptive downsampling by calculating a `step` size that limits processing to a maximum of 1000 samples per block. Replaced `Math.abs` with an inline ternary operator for tighter loop performance, and replaced the spread operator `Math.max(...filteredData)` with a manual max calculation to prevent call stack issues.
**Code:**
```typescript
const step = Math.max(1, Math.floor(blockSize / 1000));
for (let j = blockStart; j < blockEnd; j += step) {
    const val = channelData[j];
    sum += val < 0 ? -val : val; // Inline Math.abs
}
```
