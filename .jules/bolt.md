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

## 2026-03-01 - Avoid Math functions and division in tight loops

**Bottleneck:** High CPU utilization when iteratively generating waveform arrays over 10,000+ transcript segments for long audio files.
**Learning:** `Math.floor`, `Math.min`, `Math.max` function calls and floating-point divisions inside tight loops add significant overhead.
**Action:** Replace floating point division with inverted multiplication (`* (1/value)`). Replace `Math.floor` with fast bitwise floor `~~` (when numbers are always positive). Replace `Math.min`/`Math.max` with inline ternary conditionals `a < b ? a : b`.
**Code:**
```typescript
// BEFORE:
segments.forEach(segment => {
    const startBucket = Math.floor(segment.start / bucketSize);
    const endBucket = Math.floor(segment.end / bucketSize);
    const startIdx = Math.max(0, startBucket);
    const endIdx = Math.min(maxSamplesIndex, endBucket);
    // ... loop
});

// AFTER:
const invBucketSize = 1 / bucketSize;
for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const startBucket = ~~(segment.start * invBucketSize);
    const endBucket = ~~(segment.end * invBucketSize);
    const startIdx = startBucket < 0 ? 0 : startBucket;
    const endIdx = endBucket > maxSamplesIndex ? maxSamplesIndex : endBucket;
    // ... loop
}
```
