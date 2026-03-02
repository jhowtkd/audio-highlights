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

## 2026-03-02 - Audio Array Max Aggregation Crash

**Bottleneck:** Rendering the `Waveform` component triggered `Maximum call stack size exceeded` errors when handling long audio segments due to `Math.max(...data)` usage on arrays potentially exceeding argument limits in JavaScript engines. Moreover, using `Math.abs` inside the array aggregation loop causes notable function call overhead.
**Learning:** Using the spread operator (`...`) with built-in functions like `Math.max()` or `Math.min()` scales poorly and crashes on massive arrays like decoded audio buffers. Inline conditionals and avoiding object/function allocations in hot paths drastically reduce CPU time.
**Action:** Replace `Math.max(...array)` with `array.reduce((a, b) => a > b ? a : b)`. Inline `Math.abs(val)` to `val < 0 ? -val : val` in tight array processing loops. Lift invariant calculations like block division to inverse multiplication outside loops.
**Code:**
```typescript
// Replace: const max = Math.max(...data);
const max = data.reduce((a, b) => (a > b ? a : b), 1);

// Inside hot loop:
// Replace: sum += Math.abs(channelData[blockStart + j]);
const val = channelData[blockStart + j];
sum += val < 0 ? -val : val;
```
