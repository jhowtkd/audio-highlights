## 2026-01-19 - Transcript Viewer Re-render Storm
**Learning:** The `TranscriptViewer` component re-renders on every `currentTime` update during playback. With a large number of segments, re-rendering the entire list (even with React's diffing) is expensive. `React.memo` on the list item combined with stable callbacks is essential here to limit re-renders to only the changing segments.
**Action:** Extracted `TranscriptSegment` and memoized it. Ensured `onSegmentClick` is stable.
