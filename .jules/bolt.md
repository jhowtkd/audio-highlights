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
## 2024-07-05 - Throttle High-Frequency React Event Handlers that read DOM

**Bottleneck:** Un-throttled high-frequency UI events (`mousemove`) reading DOM geometry (`getBoundingClientRect`) causing layout thrashing and main-thread blocking.
**Learning:** We need to explicitly throttle such events. When deferring React event handlers using `requestAnimationFrame`, always extract the required event properties (e.g., `e.clientX`) synchronously outside the callback to avoid accessing stale or nullified event data due to React's event pooling in older versions. We must also manage the `requestAnimationFrame` lifecycle using `useRef` and `cancelAnimationFrame` inside the hook and the component's unmount cleanup `useEffect`.
**Action:** Throttle high-frequency UI events that do DOM reads/writes using `requestAnimationFrame`, synchronously capturing event fields first.
**Code:**
```typescript
const clientX = e.clientX;
if (requestRef.current) cancelAnimationFrame(requestRef.current);
requestRef.current = requestAnimationFrame(() => {
    // Read DOM geometry and update state
});
```
