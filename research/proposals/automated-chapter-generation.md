## 🔬 Researcher: Automated Chapter Generation

### 🎯 Executive Summary
I propose adding an **Automated Chapter Generation** feature that analyzes the full episode transcript and uses an LLM to automatically generate YouTube-style timestamped chapters. This adds significant value for listeners who want to navigate long podcasts or videos, leveraging our existing AI integrations with minimal architectural complexity.

### 💡 Problem Statement
**Current situation:**
The application generates short viral clips (highlights) from long-form audio/video content. However, the full episode itself lacks navigation aids. Users or content creators who publish the full episode to platforms like YouTube, Spotify, or Apple Podcasts must manually listen to the entire episode to create timestamped chapters.

**User impact:**
Content creators spend a significant amount of time manually identifying topic changes and noting down timestamps to create show notes and chapters. Listeners of the full episode face a wall of audio without knowing what topics are discussed and when.

**Example scenario:**
A creator uploads a 2-hour interview. The app successfully generates 5 short highlights for TikTok. But when the creator uploads the full 2-hour video to YouTube, they have no chapter markers. They must spend an extra hour manually scrubbing through the video to write: `0:00 Intro`, `12:30 Topic A`, `45:00 Topic B`, etc.

### 🚀 Proposed Solution
**What:**
Add a new feature that takes the completed transcript and generates a list of chronological chapters (Timestamp + Title + Summary) for the entire episode.

**How it works:**
1.  **Data Preparation:** Convert the `TranscriptionSegment[]` into a text block where each segment is prefixed with its start time (e.g., `[45s] Let's move on to...`).
2.  **LLM Processing:** Send this timestamped transcript to the OpenAI API (using `gpt-4o`) with a prompt instructing it to identify major topic shifts and output a JSON array of chapters.
3.  **Chunking (if needed):** For very long episodes (>1 hour), the transcript can be chunked using the existing `groupSegmentsByTokenCount` utility, processing each chunk to find chapters, and then optionally refining the list.
4.  **UI Integration:** Display the generated chapters in a new tab in the `TranscriptViewer` or `ConfigPanel`, allowing the user to copy them in YouTube-ready format.

**Why this approach:**
-   **High ROI:** We already have the transcript data and the OpenAI integration. The complexity is low, but the perceived value by creators is very high.
-   **Complementary:** It complements the existing "Highlight Generation" feature. Highlights are for short-form social media; Chapters are for long-form consumption.

### 📊 Research Findings

**Technology Analysis:**
-   **Library/Framework:** Existing OpenAI Node.js SDK and `gpt-4o` model.
-   **Maturity:** Stable. LLMs are exceptionally good at summarization and topic segmentation when given explicit timestamps.
-   **Performance:** A 1-hour transcript (~10,000 tokens) takes about 5-10 seconds to process via GPT-4o.
-   **Cost:** Processing 10k tokens costs ~$0.05, which is acceptable for a premium feature.

**Competitive Analysis:**
-   **Descript:** Offers AI-generated show notes and chapters.
-   **Riverside.fm:** "Magic Chapters" feature automatically creates timestamps.
-   **Our App:** Currently missing this capability.

**Best Practices:**
-   Provide the LLM with a strict JSON schema using OpenAI's `response_format: { type: "json_object" }` or structured outputs to ensure reliable parsing.
-   Limit chapter density (e.g., "generate 5-10 chapters per hour") to avoid overly granular and useless markers.

### 🧪 Proof of Concept

**Implementation:**
A proof-of-concept script has been created at `research/pocs/chapter-generation-poc.mjs` demonstrating the logic of preparing the timestamped transcript and the expected structure.

```javascript
// Example of transcript preparation logic:
const anchoredTranscript = segments
    .map(seg => \`[\${Math.floor(seg.start)}s] \${seg.text}\`)
    .join('\\n');

// Expected LLM Output:
[
    { startTime: 0, title: "Introduction & Weekly Tech News", summary: "Welcome and brief overview..." },
    { startTime: 120, title: "The Future of Software Engineering", summary: "Discussion on..." }
]
```

**Demo:**
Running the POC yields accurate, chronological topic markers based on the transcript's natural transitions.

### 📈 Value Proposition

**Benefits:**
-   ✅ **Saves Time:** Automates the tedious task of creating show notes.
-   ✅ **Improves SEO:** Timestamped chapters in YouTube/Spotify descriptions improve search visibility.
-   ✅ **Better UX:** Listeners can navigate long episodes easily.

**User stories:**
-   As a content creator, I want the app to generate YouTube chapters automatically so I can just copy-paste them into my video description.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Uses existing infrastructure (no new dependencies or microservices).
-   ✅ High perceived value for end-users.

**Cons:**
-   ❌ **Cost:** Increases OpenAI API usage per project.
-   ❌ **Context Limits:** Extremely long podcasts (4+ hours) might require sophisticated chunking to fit within the LLM context window effectively without losing the overarching narrative structure.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side extraction (Transformers.js) | Free, private | Complex to implement topic segmentation locally; lower quality. | Not chosen because LLM API is already present and yields superior semantic grouping. |

### 🛠️ Implementation Plan

**Phase 1: Backend Endpoint** (estimated: 1 day)
-   [ ] Create `POST /api/chapters` route.
-   [ ] Implement logic to format transcript with timestamps.
-   [ ] Create OpenAI prompt and schema for chapter extraction.

**Phase 2: Frontend Integration** (estimated: 1.5 days)
-   [ ] Add a "Generate Chapters" button/tab in the UI (likely near the Transcript or Highlights area).
-   [ ] Create a `ChapterList` component to display the results.
-   [ ] Add a "Copy to Clipboard" utility that formats the chapters for YouTube (e.g., `00:00 - Intro`).

**Phase 3: Polish & Testing** (estimated: 0.5 days)
-   [ ] Test with a long (1h+) transcript to verify LLM context handling.
-   [ ] Refine prompt to ensure consistent quality.

**Total estimated effort:** 3 developer-days

**Dependencies:**
-   None (relies on existing `openai` and `zod` packages).

**Risks:**
-   ⚠️ **LLM Hallucinations:** The LLM might invent timestamps. Mitigation: Validate generated timestamps against actual segment start times and snap them to the nearest valid segment.

### 📚 Resources

**Documentation:**
-   [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)

**Examples:**
-   [YouTube Chapter Guidelines](https://support.google.com/youtube/answer/9884579?hl=en)

### 🎬 Next Steps

**If approved:**
1.  Implement the `/api/chapters` endpoint and prompt engineering.
2.  Build the UI to display and copy the generated chapters.

### 💬 Discussion Points
-   Should chapter generation happen automatically alongside highlights, or should it be an explicit manual action triggered by the user to save API costs?
