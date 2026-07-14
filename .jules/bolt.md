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
## 2026-07-14 - Throttled High-Frequency Event without Dependencies

**Bottleneck:** High-frequency `mousemove` events on the waveform triggered expensive DOM layout reads (`getBoundingClientRect()`) and React state updates (`setHoveredHighlight`), causing layout thrashing.
**Learning:** Throttling high-frequency events using `requestAnimationFrame` instead of external debounce/throttle libraries effectively offloads execution from the main thread loop to frame rendering sync, preventing dropped frames. React's synthetic event pooling required synchronous extraction of `clientX` before async delegation.
**Action:** Throttle geometry reads inside high-frequency event handlers using `requestAnimationFrame`, always tracking the frame ID in a ref and cleaning it up on unmount and `mouseleave` to prevent stuck UI.
**Code:**
```typescript
// Extract synchronously
const clientX = e.clientX;

// Cancel pending
if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

// Request frame
rafRef.current = requestAnimationFrame(() => {
  // Process geometry
});
```
