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

## 2026-04-23 - `React.memo` Busted by Inline Arrow Functions

**Bottleneck:** `Waveform` component re-rendered on every state update of `TaskDetailPage` despite being seemingly simple or previously intended to be optimized. The parent component updates high-frequency state like audio `currentTime` continuously.

**Learning:** `React.memo`'s shallow comparison completely fails if *any* prop changes reference on every render. Inline arrow functions (e.g., `onSeek={(time) => setSeekTo(time)}`) create a new function instance on *every* parent render, bypassing the memoization cache and causing the heavy child component to recalculate/redraw.

**Action:**
1. Wrapped the target child component in `React.memo()`.
2. Passed the stable reference of the state setter directly to the component (e.g., `onSeek={setSeekTo}`) instead of an inline arrow function.

**Code:**
```typescript
// BAD: Breaks memoization
<Waveform onSeek={(time) => setSeekTo(time)} />

// GOOD: Preserves memoization using stable state setter
<Waveform onSeek={setSeekTo} />
```
