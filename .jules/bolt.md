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

## 2026-03-19 - Removed `flatMap` Overhead in Silence Detection

**Bottleneck:** The `detectSilences` logic in `src/app/api/decupagem/route.ts` flattened nested `TranscriptionSegment` structures using `segments.flatMap(s => s.words || [])` to pass the `WordTimestamp`s into the detector. This created a large temporary array allocation, causing potential memory overhead on long transcriptions.
**Learning:** For deep array structures that just need sequential iteration (like checking sequential words for silences), mapping to a massive single array uses excess memory. Generator functions and `Iterable` inputs are an elegant, zero-allocation alternative.
**Action:** Changed the signature of `detectSilences` from `WordTimestamp[]` to `Iterable<WordTimestamp>`, and replaced `flatMap` with a generator `function* iterateWords(segs)` in the parent.
**Code:**
```typescript
// Replaced flatMap:
// const allWords = segments.flatMap(s => s.words || []);

// With Generator:
function* iterateWords(segs: TranscriptionSegment[]) {
    for (const s of segs) {
        if (s.words) {
            for (const w of s.words) {
                yield w;
            }
        }
    }
}
const silenceSegments = detectSilences(iterateWords(segments), config.silenceThreshold);
```
