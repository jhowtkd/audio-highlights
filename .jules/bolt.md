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

## 2026-03-01 - Waveform Canvas Math Optimization and Downsampling

**Bottleneck:** High CPU utilization and potential main thread freezes during manual audio buffer processing and rendering in waveform visualizations, coupled with "Maximum call stack size exceeded" errors when tracking max on large data structures arrays using spread operator.
**Learning:** For rendering audio waveforms on an HTML canvas from `AudioBuffer` channel data, tight high-frequency processing loops generate massive overhead via standard math functions (`Math.floor`, `Math.max`, `Math.min`, `Math.abs`), closure allocations (`Array.forEach`), and division logic. Using the spread operator `Math.max(...data)` on large `channelData` arrays overflows stack limits. Furthermore, processing thousands of samples natively per pixel bar without skipping values freezes the UI thread on large files.
**Action:** Extract static logic out of loops. Substitute function calls: replace `Math.floor` with bitwise double NOT `~~`, replace divisions with inverse multiplication, and replace `Math.abs`/`Math.max`/`Math.min` with inline ternary operators. Refactor functional arrays/spreads to native `for` tracking loop blocks. Compute an intentional step size (`Math.ceil(blockSize / 100)`) to downsample evaluation runs in hot looping blocks to limit iterations per bar and prevent main thread freezes.
