1. **Analyze performance issue in `Virtuoso`:**
   - Review memory note: "To optimize `react-virtuoso` performance, avoid inline `itemContent` functions; instead, define `itemContent` outside the component or use `useCallback`, and pass dynamic data (e.g., `activeSegmentIndex`) through the `context` prop."
   - The files `src/components/transcription/transcript-viewer.tsx` and `src/components/transcription/virtualized-transcript-viewer-poc.tsx` both use inline `itemContent` functions, creating a new function reference on every render.
   - For `transcript-viewer.tsx`, the data dependencies are `activeSegmentIndex`, `matchingSegmentIds`, and `onSegmentClick`.

2. **Refactor `src/components/transcription/transcript-viewer.tsx`:**
   - Move the `itemContent` inline function out of the JSX to be memoized or static.
   - Use the `context` property in `Virtuoso` to pass `activeSegmentIndex`, `matchingSegmentIds`, and `onSegmentClick`.
   - Update `itemContent` to accept `context` as its third argument.

3. **Refactor `src/components/transcription/virtualized-transcript-viewer-poc.tsx`:**
   - Similar refactor using `context` to pass `activeSegmentIndex` and `onSegmentClick`.

4. **Verify correctness:**
   - Run linter using `npm run lint`.
   - Run tests using `vitest`.
