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

## 2026-03-08 - Function Call Overhead in Tight Waveform Loops

**Bottleneck:** High-frequency rendering loops (e.g. iterating over 200 blocks with thousands of samples each for audio data) using `Math.abs`, `Math.min`, and `Math.max` were slowing down waveform generation and normalizations, especially when fallback generation is used.
**Learning:** `Math.max` and `Math.abs` function calls introduce measurable overhead in tight loops. Additionally, using spread operators `Math.max(...data)` on large buffer arrays can trigger Maximum call stack size exceeded errors and is slower than manual accumulation.
**Action:** Replace `Math.max` and `Math.min` with inline ternary operators (`val < 0 ? -val : val`, `val > max ? val : max`). Extract static bound calculations outside the loop where possible to ensure maximum visualization rendering performance.
**Code:**
```javascript
let max = 1;
for (let i = 0; i < data.length; i++) {
    const val = data[i];
    max = val > max ? val : max;
}
```
