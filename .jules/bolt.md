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

## 2026-03-04 - Array Spread in Math.max Crashes on Large Arrays

**Bottleneck:** `Math.max(...data)` on large arrays (e.g., audio sample buffers) causes `RangeError: Maximum call stack size exceeded` and severely degrades performance.
**Learning:** The spread operator `...` passes array elements as arguments. For large arrays (thousands of elements), this exceeds the engine's argument limit.
**Action:** Replace `Math.max(...arr)` with `arr.reduce((a, b) => a > b ? a : b, 0)` or use a standard `for` loop. `.reduce()` is significantly faster and `O(1)` space, preventing call stack overflow.
**Code:**
```javascript
// BAD
const max = Math.max(...data, 1);

// GOOD
const max = data.reduce((acc, val) => (acc > val ? acc : val), 1);
```

## 2026-03-04 - Math.abs Function Call Overhead in Tight Loops

**Bottleneck:** Calling `Math.abs(val)` millions of times inside a tight audio processing `for` loop creates unnecessary function invocation overhead.
**Learning:** While modern V8 engines may inline simple `Math` functions, replacing `Math.abs` with a direct inline ternary check is reliably faster for processing millions of audio samples in synchronous execution.
**Action:** Replace `Math.abs(val)` with `val < 0 ? -val : val` in highly critical tight loops.
**Code:**
```javascript
// BAD
sum += Math.abs(channelData[i]);

// GOOD
const val = channelData[i];
sum += val < 0 ? -val : val;
```
