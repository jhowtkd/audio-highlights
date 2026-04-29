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

## 2026-02-06 - Inline Callbacks Breaking React.memo

**Bottleneck:** `Waveform` component was re-rendering 60 times/second during audio playback despite parent optimizations.
**Learning:** The parent component passed an inline arrow function `onSeek={(time) => setSeekTo(time)}` to the child. This created a new function reference on every single render of the parent, completely bypassing `React.memo` and causing unnecessary re-renders of the heavy canvas-based `Waveform` component.
**Action:** When using `React.memo` on heavy components, ensure all callback props are stable references. Use direct state setters (`onSeek={setSeekTo}`) or `useCallback` to prevent breaking memoization.
**Code:**
```typescript
// ❌ BAD: Breaks memoization
<Waveform onSeek={(time) => setSeekTo(time)} />

// ✅ GOOD: Stable reference preserves memoization
<Waveform onSeek={setSeekTo} />
```
