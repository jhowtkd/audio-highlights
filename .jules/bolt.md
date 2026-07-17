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

## 2025-02-18 - Throttle React Event Handlers with requestAnimationFrame

**Bottleneck:** Unthrottled mousemove events in the Waveform component triggering rapid state updates (`setHoveredHighlight`) and expensive recalculations, causing main thread blocking and jank.
**Learning:** `requestAnimationFrame` is highly effective for throttling UI events like `mousemove`. Crucially, when deferring React event handlers via `requestAnimationFrame`, required event properties (e.g., `e.clientX`) must be extracted synchronously outside the callback due to React's event pooling. Also, pending frames must be explicitly cancelled on unmount or `mouseleave` to avoid memory leaks and stale UI updates.
**Action:** Implemented `requestAnimationFrame` for `handleMouseMove` in `Waveform`, extracting `e.clientX` synchronously, and added proper cancellation via `useRef` and a `handleMouseLeave` callback.
