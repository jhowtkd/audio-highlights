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
## 2026-05-06 - Canvas Waveform Loop Bottleneck

**Bottleneck:** Rendering the audio waveform involved calling `ctx.fillRect()` up to 200 times per frame inside a `forEach` loop within the `useEffect` drawing cycle.
**Learning:** For static waveform data, redrawing the individual bars every frame is highly inefficient. Instead, HTML5 Canvas `Path2D` can be pre-calculated using `useMemo` for the entire waveform. The played and unplayed segments can then be drawn in just two `ctx.fill()` operations by leveraging `ctx.clip()` for the played portion.
**Action:** Always check canvas rendering loops for static geometries that can be cached into a `Path2D` object to reduce draw calls per frame.
**Code:**
```typescript
const waveformPath = useMemo(() => {
    const path = new Path2D();
    waveformData.forEach((value, index) => {
        path.rect(x, y, w, h);
    });
    return path;
}, [waveformData, dimensions]);

// Inside draw loop
ctx.save();
ctx.rect(0, 0, playedPosition, height);
ctx.clip();
ctx.fill(waveformPath);
ctx.restore();
```
