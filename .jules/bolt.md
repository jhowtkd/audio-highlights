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
## 2026-01-24 - Throttled handleMouseMove with requestAnimationFrame

**Bottleneck:** Synchronous execution of React event handlers on every mouse move dispatch.
**Learning:** React synthetic events like `onMouseMove` fire at a very high frequency. Synchronously calculating DOM metrics (`getBoundingClientRect()`) and performing a binary search on every event caused main thread blocking and layout thrashing, resulting in UI jank. Throttling these expensive operations to the browser's render cycle (typically 60fps) using `requestAnimationFrame` significantly improves UI responsiveness.
**Action:** Always throttle high-frequency UI events like `mousemove` or `scroll` if they involve layout reads or heavy computations. Remember to synchronously extract synthetic event properties (e.g., `e.clientX`) outside the async callback to avoid accessing stale data due to React's event pooling, and always cancel pending animation frames in a `mouseleave` handler and a component unmount `useEffect` to prevent memory leaks and stuck states.
**Code:**
```typescript
hoverFrameRef.current = requestAnimationFrame(() => {
    // Heavy computation here
});
```
