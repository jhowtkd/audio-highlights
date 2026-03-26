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

## 2026-03-26 - Audio Waveform Processing Bottlenecks

**Bottleneck:** The manual waveform generation on canvas iterated over millions of `AudioBuffer` samples in the main thread (e.g. `26.4 million` samples for a 10 min file) causing severe jank. Additionally, `Math.max(...array)` on large array distributions threw "Maximum call stack size exceeded" errors. Division in normalization was adding unnecessary overhead inside hot loops.
**Learning:** For rendering visualizations, pixel-perfect sampling of audio buffers is entirely unnecessary and incredibly slow. Moreover, V8 engine has strict call stack limits that `...spread` operators can breach on arrays > ~10k elements. Inverse multiplication outperforms division.
**Action:** Implemented downsampling by dynamically calculating a `stepSize` to guarantee a fixed maximum number of sample iterations per frame, scaling performance from O(N) down to O(1) for loops over sample blocks. Replaced spread syntax with `.reduce()` on arrays of arbitrary lengths, and used inverse multipliers (e.g. `1 / max`) for fast normalized mappings.
**Code:**
```typescript
const stepSize = Math.max(1, Math.ceil(blockSize / 100));
for (let j = 0; j < blockSize; j += stepSize) { ... }
const multiplier = filteredData.reduce((acc, val) => (val > acc ? val : acc), 0.0001);
const inverseMultiplier = 1 / multiplier;
```
