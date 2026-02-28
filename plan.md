1. **Optimize Virtuoso in `transcript-viewer.tsx`**
   - In `src/components/transcription/transcript-viewer.tsx`, the `itemContent` prop is currently an inline function:
     ```tsx
     itemContent={(index, segment) => (
       <div className="pb-2 pr-2">
         <TranscriptSegment
           segment={segment}
           isActive={index === activeSegmentIndex}
           isMatch={matchingSegmentIds.has(segment.id)}
           onSegmentClick={onSegmentClick}
         />
       </div>
     )}
     ```
   - This causes unnecessary re-renders when context changes.
   - We will define the `context` interface for `Virtuoso` to hold `activeSegmentIndex`, `matchingSegmentIds`, and `onSegmentClick`.
   - We will define a stable `itemContent` function outside the component.
   - We will pass `context={{ activeSegmentIndex, matchingSegmentIds, onSegmentClick }}` to the `<Virtuoso>` component.

2. **Optimize Virtuoso in `virtualized-transcript-viewer-poc.tsx`**
   - Apply the same optimization pattern.
   - Define a stable `itemContent` function outside the component.
   - Pass `context={{ activeSegmentIndex, onSegmentClick }}`.

3. **Verify and Pre-commit**
   - Ensure the app builds and lints cleanly without type errors.
   - Call `pre_commit_instructions` to follow testing, verification, review, and reflection checks.
   - Run tests (`npm run test`) and linter (`npm run lint`).

4. **Submit**
   - Submit the changes using the `submit` tool with a descriptive commit message.
