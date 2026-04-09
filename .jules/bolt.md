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
## 2025-02-18 - Optimized Multiple Array Passes for Status Counts

**Bottleneck:** In `useTaskQueue`, deriving counts for `pending`, `completed`, and `error` task statuses was done using three separate `state.tasks.filter(t => t.status === '...').length` calls. This causes array iterations of O(3N).
**Learning:** Multiple array traversals can be replaced with a single `reduce` pass to minimize looping overhead, particularly when recalculating counts on status change. Combining this with `useMemo` avoids redundant iteration and array creation during re-renders.
**Action:** When extracting multiple statistics (counts, sums) based on conditional items in a list, utilize a single `reduce` traversal wrapping the counts in an accumulator object.
**Code:**
```typescript
const counts = useMemo(() => {
    return state.tasks.reduce((acc, t) => {
        if (t.status === 'pending') acc.pending++;
        else if (t.status === 'completed') acc.completed++;
        else if (t.status === 'error') acc.error++;
        return acc;
    }, { pending: 0, completed: 0, error: 0 });
}, [state.tasks]);
```
