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

## 2026-05-15 - Array Restructuring Overhead during Transcription Merging

**Bottleneck:** the `reduce` array merging step taking up to 1+ second when merging 50,000+ segments.
**Learning:** Destructuring and the `push()` call inside a `reduce()` was constantly forcing the JavaScript VM to dynamically resize and reallocate elements into the newly merged array, causing unnecessary garbage collection operations overhead for thousands of transcription segments. Pre-allocating an array with exact size eliminates this overhead.
**Action:** When merging massive parallel task payloads, calculate total bounds and use pre-allocated static-size arrays with indexed insertion loops.
**Code:**
```typescript
let totalSegments = 0;
for (let i = 0; i < results.length; i++) { totalSegments += results[i].segments.length; }
const allSegments = new Array(totalSegments);
// Use simple loop rather than push() or destructuring
```
