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

## 2026-05-07 - Pre-calculating Path2D Objects for React Canvas

**Bottleneck:** In Next.js/React applications rendering HTML5 Canvas elements, recreating paths (like waveform bars or highlights) and executing JS loops inside `useEffect` 60 times per second during playback causes severe main thread blocking and performance drops.
**Learning:** Pre-calculating `Path2D` objects using `useMemo` avoids the per-frame overhead and delegates the drawing heavy-lifting to native browser implementations using `ctx.fill(path)`. To render dynamic play states, combine it with `ctx.save()`, `ctx.clip()`, and `ctx.restore()`. Remember to check `typeof window !== 'undefined'` to avoid Next.js SSR build errors because `Path2D` is a browser API.
**Action:** Always pre-calculate static paths with `Path2D` inside `useMemo` for complex canvas renderings, and use clipping for progress bars or played indicators.
