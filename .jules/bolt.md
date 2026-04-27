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

## 2026-04-27 - Waveform Component Memoization with Stable Props

**Bottleneck:** The `Waveform` component is heavy (renders canvas graphics) and was being re-rendered on every parent state change because its `onSeek` prop received an inline arrow function (`onSeek={(time) => setSeekTo(time)}`).

**Learning:** Wrapping a component in `React.memo` is ineffective if any of its props change on every render. Inline arrow functions create a new reference on every render, completely breaking the memoization. By passing the state setter function `setSeekTo` directly, a stable reference is provided.

**Action:** When memoizing a component with callback props, always pass stable references (like direct state setters or functions wrapped in `useCallback`) instead of inline arrow functions.

**Code:**
```typescript
// Parent Component (Before)
<Waveform onSeek={(time) => setSeekTo(time)} />

// Parent Component (After)
<Waveform onSeek={setSeekTo} />

// Child Component
export const Waveform = React.memo(function Waveform({ ... }) { ... });
```
