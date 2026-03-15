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

## 2026-03-05 - Avoid flatMap for Large Arrays in Silence Detection

**Bottleneck:** High memory allocation and computation time when flattening nested transcription segments into a single words array (`flatMap`) for silence detection across thousands of segments.
**Learning:** `flatMap` allocates a large intermediate array. Generating arrays inside tight or high-frequency loops is expensive in Javascript. Using a generator `function*` to yield values iteratively avoids creating this intermediate array, drastically reducing memory footprint and offering a performance boost. Although a single-pass loop is technically fastest, using an `Iterable` offers a good compromise by keeping utility functions generic while improving performance and memory efficiency over `flatMap`.
**Action:** Replace `flatMap` with a generator `function*` when aggregating large datasets (like words from transcription segments) and update utility functions to accept `Iterable` interfaces.
**Code:**
```typescript
function* iterateWords(segs: TranscriptionSegment[]) {
    for (const segment of segs) {
        if (segment.words) {
            for (const word of segment.words) {
                yield word;
            }
        }
    }
}
detectSilences(iterateWords(segments));
```
