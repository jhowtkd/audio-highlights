## 🔬 Researcher: AI-Generated Show Notes

### 🎯 Executive Summary
Leverage our existing OpenAI integration to automatically generate structured podcast show notes (summaries, key takeaways, timestamps, and resources) from the transcribed audio. This provides high-value content repurposing for users with zero new dependencies and minimal technical complexity.

### 💡 Problem Statement
**Current situation:**
The application successfully transcribes audio and generates viral clips (highlights). However, podcast creators also need written show notes for their YouTube descriptions, blog posts, and podcast directories (Spotify, Apple Podcasts). Currently, they must manually write these based on the transcript or use a separate tool.

**User impact:**
- **Time-consuming:** Writing good show notes takes 30-60 minutes per episode.
- **Incomplete workflows:** Users have to leave our platform to finish their podcast publication process.

**Example scenario:**
A user uploads an hour-long podcast, gets their viral clips, but then has to copy the entire transcript into ChatGPT manually to get a summary and timestamps for their episode description.

### 🚀 Proposed Solution
**What:**
Add a "Generate Show Notes" button to the UI that takes the full transcript and uses the existing OpenAI integration to produce a structured Markdown document containing:
1.  Episode Summary
2.  Key Takeaways
3.  Chapter Timestamps
4.  Resources/Links mentioned

**How it works:**
1.  Add a new `/api/show-notes` route that accepts the transcript segments.
2.  Chunk the transcript if necessary (reusing existing `search-chunking.ts` logic to handle context limits).
3.  Prompt the `GPT_MODEL` to generate the structured Markdown.
4.  Display the result in a new UI component (`ShowNotesViewer`) with a "Copy to Clipboard" and "Download Markdown" button.

**Why this approach:**
It utilizes infrastructure we already have (OpenAI SDK, chunking logic, Markdown export) to deliver a highly requested feature in the podcasting space. The ROI is incredibly high.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Existing `openai` Node SDK and Next.js App Router.
- **Maturity:** Highly stable.
- **Complexity:** Low. No new dependencies.

**Competitive Analysis:**
- **Descript:** Offers AI show notes as a premium feature.
- **Riverside:** Generates show notes automatically.
- **Our App:** Currently lacks this, putting us behind the standard AI podcasting feature set.

**Best Practices:**
- Instruct the LLM to format timestamps clearly (e.g., `MM:SS`) to be compatible with YouTube chapters.
- Return raw Markdown for easy copying/pasting.

### 🧪 Proof of Concept

**Implementation:**
A successful Proof of Concept was built in `research/pocs/show-notes-poc.mjs`.

```javascript
// research/pocs/show-notes-poc.mjs
const prompt = `You are an expert podcast producer. Generate structured show notes based on the following transcript.

Format the output as Markdown with the following sections:
- **Episode Summary** (2-3 sentences)
- **Key Takeaways** (3-5 bullet points)
- **Timestamps** (Important topics with their starting times)
- **Resources Mentioned** (Any links, books, or tools mentioned)

Transcript:
[0s - 5s]: Welcome to the podcast. Today we are talking about artificial intelligence.
...`;
```

**Output:**
```markdown
## Episode Summary
In this episode, we dive into the transformative impact of artificial intelligence...

## Key Takeaways
- AI tools like Copilot and ChatGPT are revolutionizing...

## Timestamps
- **0:00** - Introduction to AI in software development
- **0:05** - The impact of tools like Copilot...
```

### 📈 Value Proposition

**Benefits:**
- ✅ **Massive Time Saver:** Saves creators 30+ minutes per episode.
- ✅ **Increased Platform Stickiness:** Keeps users in our app for their entire post-production workflow.
- ✅ **High ROI:** Uses existing API connections; very cheap to implement and run.

**User stories:**
- As a podcaster, I can click one button to get my YouTube description and Spotify show notes formatted perfectly with timestamps.

### ⚖️ Trade-offs

**Pros:**
- ✅ Zero new dependencies.
- ✅ Reuses existing architecture (OpenAI client, error handling).

**Cons:**
- ❌ Adds slightly more token cost per user (though minimal compared to transcription/highlights).
- ❌ Very long podcasts (>3 hours) might hit context window limits (mitigated by our chunking utilities).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Extract notes during Highlight generation | Saves API calls | Makes the highlight prompt too complex/unreliable | Not chosen. Keep concerns separated via a dedicated API endpoint. |

### 🛠️ Implementation Plan

**Phase 1: Backend API** (estimated: 0.5 days)
- [ ] Create `src/app/api/show-notes/route.ts`.
- [ ] Implement chunking/prompting logic using OpenAI SDK.

**Phase 2: Frontend UI** (estimated: 1 day)
- [ ] Create `ShowNotesViewer` component.
- [ ] Add "Generate Show Notes" button near the export options in the `TranscriptViewer` or as a new tab.
- [ ] Implement "Copy" and "Download" buttons for the Markdown.

**Phase 3: Polish** (estimated: 0.5 days)
- [ ] Add loading states and error handling.
- [ ] Ensure formatting looks good in dark mode.

**Total estimated effort:** 2 developer-days

**Dependencies:**
- None. (Uses existing `openai` and UI components).

**Risks:**
- ⚠️ Context window limits for huge files - Mitigation: Use `search-chunking.ts` to summarize chunks if needed, or use a larger context model (GPT-4o handles 128k natively).

### 🎬 Next Steps

**If approved:**
1. Build the `/api/show-notes` endpoint.
2. Integrate it into the frontend.
3. Test with a 1-hour podcast to verify formatting.

### 💬 Discussion Points
- Should we allow users to customize the show notes prompt (e.g., "Add Twitter handles", "Make it funny")? Or keep it standardized for now?
