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

## 2026-05-02 - Canvas Path2D Rendering Optimization

**Bottleneck:** High CPU usage when drawing thousands of audio waveform rectangles on every frame during playback (`currentTime` updates frequently).
**Learning:** Calling `fillRect()` for hundreds of bars inside the main `useEffect` drawing loop causes unnecessary performance overhead, as the bars' geometry is static once the audio is loaded.
**Action:** Use `Path2D` to pre-calculate and cache the paths for all waveform bars and highlight regions inside a `useMemo` hook. In the `useEffect` drawing loop, use a single `ctx.fill(path)` call for the unplayed bars, and then use `ctx.save()`, `ctx.rect()`, `ctx.clip()`, and `ctx.fill(path)` for the played portion.
**Code:** Use `new Path2D()`, `path.rect(...)` inside `useMemo`, then `ctx.fill(path)` and `ctx.clip()` in `useEffect`.
