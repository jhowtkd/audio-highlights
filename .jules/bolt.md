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

## 2026-01-24 - Canvas Path2D Clip for Waveform Render Loops

**Bottleneck:** Drawing audio waveforms using HTML5 Canvas `fillRect` inside a `useEffect` loop that runs every frame as `currentTime` updates, resulting in thousands of draw calls and degraded performance.
**Learning:** Instead of a per-frame JS loop doing multiple `fillRect` calls, pre-calculating a single `Path2D` object for the entire waveform and using `ctx.save()`, `ctx.clip()`, and `ctx.fill()` with the single path allows native browser rendering, dramatically reducing CPU overhead (up to ~280x performance gain in benchmarks).
**Action:** When drawing complex static shapes like waveforms with a dynamic progress fill, always pre-compute a `Path2D` and use native `clip()` to draw dynamic play state regions.
**Code:**
```javascript
// Pre-calculate path
const path = new Path2D();
data.forEach(val => path.rect(x, y, w, h));

// Draw clipped portions
ctx.save(); ctx.rect(0, 0, playedPos, height); ctx.clip();
ctx.fillStyle = 'blue'; ctx.fill(path); ctx.restore();
```
