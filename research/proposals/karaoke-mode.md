## 🔬 Researcher: Interactive Word-Level Transcription (Karaoke Mode)

### 🎯 Executive Summary
I propose upgrading the `TranscriptSegment` component to support **Interactive Word-Level Transcription (Karaoke Mode)**. This feature will allow users to click on individual words to seek the audio to that exact moment and visualize the currently spoken word in real-time. This significantly improves navigation precision and enhances the playback experience, aligning with premium tools like Descript.

### 💡 Problem Statement
**Current situation:**
The current `TranscriptSegment` renders text as a single paragraph block. Users can only click to seek to the *beginning* of a segment.
1.  **Imprecise Navigation:** Segments can be long (30+ seconds). Finding a specific sentence or word requires trial-and-error seeking on the timeline.
2.  **Lack of Visual Feedback:** During playback, the user only knows which *segment* is active, but not which *word* is being spoken.
3.  **Editing Friction:** Creating precise highlights requires finding exact start/end points, which is difficult without word-level interaction.

**User impact:**
Content creators struggle to make precise cuts. Listeners lose their place within long segments.

**Example scenario:**
A user wants to start a highlight exactly when the speaker says "But wait, there's more!". Currently, they click the segment start, listen for 15 seconds, pause, scrub back a bit, play again, scrub forward... With Karaoke Mode, they simply click the word "But" and the player jumps there instantly.

### 🚀 Proposed Solution
**What:**
Update `TranscriptSegment` to render the `words` array (already provided by the Transcription API) as individual, interactive spans.

**How it works:**
1.  **Data:** The existing `TranscriptionSegment` type already includes `words: WordTimestamp[]`.
2.  **Rendering:** Instead of ` <p>{segment.text}</p>`, we map over `segment.words`.
3.  **Interaction:** Each word span has an `onClick` handler calling `onSeek(word.start)`.
4.  **Highlighting:** The component receives `currentTime`. Words where `currentTime` is between `start` and `end` get an `.active` class. Words before `currentTime` get a `.past` class.

**Why this approach:**
-   **Low Risk:** The backend already supports it. Purely a frontend enhancement.
-   **High Value:** Immediate UX improvement.
-   **Performance:** `TranscriptViewer` is already virtualized, so rendering extra DOM elements for *visible* segments is performant.

### 📊 Research Findings

**Technology Analysis:**
-   **Library:** React (native state/props).
-   **Data Source:** Groq Whisper API (already configured with `timestamp_granularities: ['word']`).
-   **Performance:** React Virtualization (`react-virtuoso`) handles the list efficiently. Word-level updates are scoped to the active segment via memoization.

**Competitive Analysis:**
-   **Descript:** Gold standard for "text-based audio editing". Supports full karaoke mode.
-   **Spotify:** Lyrics feature uses karaoke-style syncing.
-   **YouTube:** Auto-generated captions highlight current word/phrase.
-   **Our App (Current):** Segment-level only.

**Best Practices:**
-   **Accessibility:** Use `aria-current="step"` on the active word.
-   **Interaction:** Hover states should indicate clickability.
-   **Visuals:** Subtle highlight (bold or background color) to avoid distraction.

### 🧪 Proof of Concept

**Implementation:**
A POC component `KaraokeTranscriptPOC` has been created in `src/components/transcription/karaoke-transcript-poc.tsx`.
A demo page is available at `src/app/research-poc/karaoke/page.tsx`.

```tsx
// Simplified Logic
export const KaraokeWord = ({ word, currentTime, onSeek }) => {
  const isActive = currentTime >= word.start && currentTime <= word.end;
  return (
    <span
      onClick={() => onSeek(word.start)}
      className={cn(
        "cursor-pointer hover:bg-blue-100",
        isActive && "bg-blue-200 text-blue-800 font-bold"
      )}
    >
      {word.word}{" "}
    </span>
  );
};
```

**Performance:**
-   **Rendering:** Virtualization ensures only ~10-20 segments are in the DOM.
-   **Updates:** Only the *active* segment re-renders on time update (by checking `activeSegmentIndex` in parent).

### 📈 Value Proposition

**Benefits:**
-   ✅ **Precision:** Seek to exact word instantly.
-   ✅ **Engagement:** Follow along with audio effortlessly.
-   ✅ **Professionalism:** Elevates the app's perceived quality.

**User stories:**
-   As a creator, I want to click the exact word where a sentence starts to define a highlight start time.
-   As a listener, I want to see exactly what is being said right now.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Uses existing API data (no backend changes).
-   ✅ Significant UX upgrade.

**Cons:**
-   ❌ **DOM Size:** Increases number of DOM nodes (spans per word vs one p tag). Virtualization mitigates this.
-   ❌ **Complexity:** Need to handle `currentTime` updates efficiently to avoid lag.

### 🛠️ Implementation Plan

**Phase 1: Component Update** (estimated: 1 day)
-   [ ] Update `TranscriptViewer` to accept `currentTime` prop.
-   [ ] Pass `currentTime` to `TranscriptSegment` (only if active).
-   [ ] Refactor `TranscriptSegment` to render `words` if available.

**Phase 2: Interaction** (estimated: 1 day)
-   [ ] Implement `onWordClick` handler.
-   [ ] Add styling for active/hover states.

**Phase 3: Polish** (estimated: 0.5 days)
-   [ ] accessibility attributes.
-   [ ] Verify performance on mobile.

**Total estimated effort:** 2.5 developer-days

**Dependencies:**
-   None (React native).

### 🎬 Next Steps

**If approved:**
1.  Implement the changes in `TranscriptViewer` and `TranscriptSegment`.
