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

## 2026-03-22 - Optimized Waveform Rendering Loop

**Bottleneck:** High CPU usage and main thread blocking during audio waveform rendering in `src/components/audio/waveform.tsx` for large files due to inefficient loops and heavy function calls.
**Learning:** In hot loops processing large arrays (like audio channels or transcription segments), `Math.min`, `Math.max` and `Math.abs` incur significant overhead. Also, using the spread operator on large arrays (`Math.max(...data)`) can throw "Maximum call stack size exceeded" errors. Division is slower than multiplication.
**Action:** Replaced division with inverse multiplication, replaced `Math` functions with inline ternaries (`val < 0 ? -val : val`, `v < 1 ? v : 1`), used `~~` instead of `Math.floor`, and replaced spread operators with manual loops for calculating max values.
**Code:**
```typescript
// Before
const max = Math.max(...data);
for (let i = 0; i < blockSize; i++) { sum += Math.abs(data[i]); }
const startBucket = Math.floor(segment.start / bucketSize);

// After
let max = 0; for (let i = 0; i < data.length; i++) { if (data[i] > max) max = data[i]; }
for (let i = 0; i < blockSize; i++) { const val = data[i]; sum += val < 0 ? -val : val; }
const inverseBucketSize = 1 / bucketSize; const startBucket = ~~(segment.start * inverseBucketSize);
```
