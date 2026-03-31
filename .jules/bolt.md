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

## 2024-03-31 - Redundant Division in Waveform Generation

**Bottleneck:** Unnecessary CPU cycles spent dividing summed audio samples by `blockSize` to calculate an average, just to immediately normalize those averages against their own maximum.
**Learning:** When calculating values that will subsequently be relative to their own maximum (like audio visualization bars), scalar divisions applied equally to all elements cancel out mathematically during the normalization step.
**Action:** Remove the redundant division during the summation loop, and only apply math during the final normalization pass.
**Code:**
```typescript
// BEFORE:
filteredData.push(sum / blockSize);
const max = Math.max(...filteredData);
const normalized = filteredData.map(n => n / max);

// AFTER:
filteredData.push(sum);
const max = Math.max(...filteredData);
const normalized = filteredData.map(n => n / max);
```

## 2024-03-31 - Naive Downsampling Breaks Audio Waveforms

**Bottleneck:** Main thread freezing when iterating over massive arrays of PCM audio data to generate visual waveforms.
**Learning:** A proposed optimization to skip samples (e.g., `j += step`) to speed up the loop caused a severe functional regression. This naive downsampling introduces aliasing and causes the visualizer to completely miss transient peaks (like drum hits) if the `step` jumps over them.
**Action:** Do not use naive downsampling for audio envelope extraction without applying a proper low-pass filter first. To prevent main thread blocking, the entire iteration should be moved to a Web Worker instead, preserving the accuracy of iterating over every sample.
