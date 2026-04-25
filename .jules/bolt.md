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

## 2025-02-21 - Waveform Re-renders Blocked Main Thread

**Bottleneck:** The heavy `Waveform` component (using Canvas and complex math) was re-rendering unnecessarily whenever parent components (like `page.tsx`) updated their state (e.g., changing tabs or updating minor UI elements).
**Learning:** React re-renders child components by default if the parent renders. Additionally, passing inline arrow functions (like `onSeek={(time) => setSeekTo(time)}`) creates a new function reference on *every* render, completely breaking `React.memo` even if it is applied.
**Action:** Wrap heavy components like `Waveform` in `React.memo()` and ensure that callback props (like `onSeek`) use stable references (e.g., passing the state setter directly `onSeek={setSeekTo}` or using `useCallback`).
**Code:**
```typescript
// Component:
export const Waveform = memo(function Waveform({ ... }) { ... });

// Usage:
<Waveform onSeek={setSeekTo} />
```
