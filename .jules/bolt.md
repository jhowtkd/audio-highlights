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

## 2024-07-10 - Throttling High-Frequency DOM Reads

**Bottleneck:** Layout thrashing due to synchronous `getBoundingClientRect()` calls inside the `mousemove` event handler in the Waveform component.
**Learning:** High-frequency events (like `mousemove` or `scroll`) reading DOM geometry synchronously block the main thread and cause layout thrashing. When delegating to `requestAnimationFrame` in React, we must extract event properties (like `e.clientX`) synchronously, as React event pooling might nullify them by the time the frame executes. We also must track the frame ID to cancel pending frames and avoid memory leaks.
**Action:** Explicitly throttle DOM geometry reads using `requestAnimationFrame`, extract required event properties synchronously, and manage frame cancellation using a `useRef` and `useEffect` cleanup.
**Code:**
```tsx
const clientX = e.clientX;
if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
rafRef.current = requestAnimationFrame(() => {
  // read bounding client rect here
});
```
