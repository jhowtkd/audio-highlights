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

## 2026-05-13 - Optimized Array Merging for Audio Chunks

**Bottleneck:** When merging transcription chunks from concurrent workers, `results.reduce` dynamically appended arrays inside a loop (`acc.allSegments.push(...r.segments)` or `for` loop with `push`). For very long audio files with thousands of segments, this caused significant reallocation and resizing overhead in the V8 engine, and spread operators can even cause stack overflows.
**Learning:** For performance-critical code paths that aggregate arrays whose size can be computed beforehand, pre-allocating the target array to its final capacity eliminates dynamic memory reallocation.
**Action:** Replaced dynamic `push` inside a `reduce` with a loop that computes `totalSegments` first, allocates fixed-size arrays (`new Array(totalSegments)`), and populates them using a continuous index pointer.
**Code:**
```typescript
let totalSegments = 0;
for (let i = 0; i < results.length; i++) {
    totalSegments += results[i].segments.length;
}
const allSegments = new Array<TranscriptionSegment>(totalSegments);
let segmentIndex = 0;
for (let i = 0; i < results.length; i++) {
    for (let j = 0; j < results[i].segments.length; j++) {
        allSegments[segmentIndex++] = results[i].segments[j];
    }
}
```
