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

## 2026-02-05 - Inline Functions Break Memoization

**Bottleneck:** High-frequency state updates (60Hz for `currentTime`) managed in parent components caused massive tree re-renders because heavy child components like `Waveform` were missing `React.memo`, and their callback props were using inline arrow functions.
**Learning:** Passing inline arrow functions as callback props (`onSeek={(time) => setSeekTo(time)}`) creates a new reference on every render. Even if the child component is wrapped in `React.memo`, the new reference will completely break memoization and trigger unnecessary re-renders.
**Action:** When passing callbacks to heavy components, always use stable references like direct state setters (e.g., `onSeek={setSeekTo}`) or `useCallback`. Ensure the child is properly wrapped in `React.memo`.
**Code:**
```tsx
// ❌ BAD: Breaks memoization
<Waveform onSeek={(time) => setSeekTo(time)} />

// ✅ GOOD: Stable reference preserves memoization
<Waveform onSeek={setSeekTo} />
```
