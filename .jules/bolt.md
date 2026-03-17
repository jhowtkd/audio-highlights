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

## 2026-03-17 - Audio Waveform Generation Optimization

**Bottleneck:** Rendering the audio waveform on the canvas for long files requires processing millions of elements from `AudioBuffer.getChannelData(0)`. Looping over every single sample on the main thread blocked UI interactions and caused freezing. Additionally, using `Math.max(...filteredData)` on dynamic arrays can theoretically exceed maximum call stack sizes if not carefully bounded.
**Learning:** For rendering small canvases (e.g., 200 bars), inspecting every single audio sample is completely unnecessary for visual representation. Downsampling by reading only a subset of samples per block works perfectly and drastically improves processing speed.
**Action:** Instead of iterating over all elements in the `blockSize`, define a step (`Math.ceil(blockSize / 100)`) to check only a maximum of 100 samples per block. We also replaced `Math.abs`, `Math.max` array spreading, and division in array mapping with faster loop-based and inverse multiplication logic to save CPU cycles.
**Code:**
```typescript
const step = Math.ceil(blockSize / 100);
for (let i = 0; i < samples; i++) {
    const blockStart = blockSize * i;
    let sum = 0;
    let count = 0;
    // Downsample the loop with `step`
    for (let j = 0; j < blockSize; j += step) {
        const val = channelData[blockStart + j];
        sum += val < 0 ? -val : val; // Inline Math.abs
        count++;
    }
    const avg = sum / count;
    filteredData[i] = avg;
    if (avg > multiplier) multiplier = avg; // No spread operator
}
```
