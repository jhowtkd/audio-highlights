## 🔬 Researcher: Karaoke Mode (Word-level synchronization)

### 🎯 Executive Summary
Implementing a "Karaoke Mode" to provide interactive, word-level highlighting during audio playback. This improves user navigation precision and accessibility by visually synchronizing the exact spoken word with the audio.

### 💡 Problem Statement
**Current situation:**
The current transcript viewer highlights text at the segment level (sentences or phrases).

**User impact:**
Users lose track of the exact word being spoken during long segments, making precise editing and navigation difficult.

**Example scenario:**
A user wants to trim a segment exactly before a specific word, but only has segment-level timestamps, causing them to scrub back and forth repeatedly to find the exact cut point.

### 🚀 Proposed Solution
**What:**
An interactive "Karaoke Mode" transcript viewer that highlights individual words as they are spoken.

**How it works:**
It utilizes the word-level timestamps provided by the Whisper API (`TranscriptionSegment.words`). The component maps each word to a precise time range and visually highlights it based on the audio player's `currentTime`.

**Why this approach:**
The backend already supports word-level timestamps. The existing POC (`KaraokeTranscriptPOC`) demonstrates that word-level mapping is performant and significantly enhances the UX for precise navigation.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** React
- **Maturity:** Stable
- **Adoption:** Native to our stack, no external heavy dependencies required for the UI logic.
- **Community:** Well understood pattern (similar to lyrics display in Spotify/Apple Music).
- **License:** MIT (React)
- **Bundle size:** Negligible (custom implementation)

**Competitive Analysis:**
- Product A: Descript (Offers word-level highlighting and editing capabilities natively)
- Product B: Riverside (Provides word-level transcription tracking during playback)

**Best Practices:**
Ensure accessibility (ARIA attributes on active words) and maintain performance by aggressively memoizing word rendering to prevent full-tree re-renders on every audio time update.

### 🧪 Proof of Concept

**Implementation:**
```tsx
// See full implementation in src/components/transcription/karaoke-transcript-poc.tsx
// Core logic demonstrating word highlighting based on currentTime:
const isWordActive = isActive && currentTime >= word.start && currentTime <= word.end;
// ... apply specific active classes based on isWordActive
```

**Demo:**
Available locally via the research branch by visiting `/research-poc/karaoke`.

**Performance:**
- Before: Segment-level updates (React tree updates infrequently).
- After: Word-level updates (~every 50ms).
- Impact: Slight increase in render frequency, effectively mitigated by `useMemo` at the segment level.

### 📈 Value Proposition

**Benefits:**
- ✅ Precise navigation and editing down to the word level.
- ✅ Improved accessibility for users who rely on visual tracking alongside audio.
- ✅ Modern, premium feel matching industry leaders in the podcast space.

**User stories:**
- As an editor, I can click a specific word to seek the audio exactly to that moment so that I can make precise cuts.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massively improves precision editing.
- ✅ Leverages existing data (Whisper word-level timestamps).

**Cons:**
- ❌ Higher rendering frequency could impact performance on lower-end devices if not carefully memoized.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Keep Segment Level | No performance risk | Frustrating UX for editing | Not chosen because precision is a core value prop for this tool. |
| Server-side rendering of lyrics | None for interactive editors | Doesn't allow click-to-seek | Not chosen because it defeats the purpose of interactive editing. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 days)
- [ ] Refactor `KaraokeTranscriptPOC` logic to ensure production readiness.
- [ ] Connect audio player's `currentTime` updates to the new sub-components.

**Phase 2: Core Feature** (estimated: 1 days)
- [ ] Integrate into the main `TranscriptViewer` component.
- [ ] Add user setting to toggle "Karaoke Mode" on/off.

**Phase 3: Polish & Testing** (estimated: 1 days)
- [ ] Implement click-to-seek functionality at the word level.
- [ ] Accessibility review and performance profiling with large transcripts.

**Total estimated effort:** 3 developer-days

**Dependencies:**
- None (reusing existing Whisper API output and React primitives).

**Risks:**
- ⚠️ Performance degradation on large transcripts - Mitigation: Ensure `react-virtuoso` handles unmounted segments correctly and `useMemo` strictly guards re-renders.

### 📚 Resources

**Documentation:**
- [OpenAI Whisper Word-level Timestamps](https://platform.openai.com/docs/guides/speech-to-text)

**Examples:**
- Existing `src/components/transcription/karaoke-transcript-poc.tsx`

**Community:**
- N/A

### 🎬 Next Steps

**If approved:**
1. Review the POC performance with realistic large transcripts.
2. Draft PR for integrating Karaoke Mode into `TranscriptViewer`.
3. Conduct QA on low-end devices to verify performance constraints.

**Questions to resolve:**
- [ ] Should "Karaoke Mode" be enabled by default, or opt-in?
- [ ] Do we need a visual toggle switch for this feature in the UI?

### 💬 Discussion Points
- How does this feature impact our plans for text-based video editing (cutting video by deleting text)?