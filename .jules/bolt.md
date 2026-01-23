## 2026-01-19 - Transcript Viewer Re-render Storm
**Learning:** The `TranscriptViewer` component re-renders on every `currentTime` update during playback. With a large number of segments, re-rendering the entire list (even with React's diffing) is expensive. `React.memo` on the list item combined with stable callbacks is essential here to limit re-renders to only the changing segments.
**Action:** Extracted `TranscriptSegment` and memoized it. Ensured `onSegmentClick` is stable.

## 2026-01-20 - Audio Processing Pipeline Bottleneck
**Learning:** Sequential processing of independent stages (splitting vs transcribing) leaves resources idle. Pipelining the splitting (producer) and transcription (consumer) phases allows transcription to start immediately after the first chunk is ready, significantly reducing total processing time for large files.
**Action:** Refactored `processLargeAudioWithFFmpeg` to use a producer-consumer pattern with a shared queue, enabling concurrent splitting and transcription.
