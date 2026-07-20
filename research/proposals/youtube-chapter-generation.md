## 🔬 Researcher: YouTube Chapter Generation (Show Notes)

### 🎯 Executive Summary
I propose adding an **Automated Chapter Generation** feature that analyzes the full transcript and generates YouTube-formatted chapters and show notes. This will leverage the existing GPT-4o integration to summarize long-form audio/video into logical segments, providing immediate value for content creators exporting their work to YouTube or podcast platforms.

### 💡 Problem Statement
**Current situation:**
AudioHighlights currently generates viral micro-clips (Highlights) from long-form content. However, creators also need structured metadata for the full episode (chapters/timestamps) to upload to YouTube or Spotify.

**User impact:**
Creators spend significant time manually listening to their own 1-2 hour episodes to note down timestamps for YouTube chapters. This is a tedious, manual process that breaks their workflow.

**Example scenario:**
A user uploads a 1-hour interview. They get 5 great highlights, but they still have to manually scrub through the audio to write:
`00:00 - Introduction`
`05:30 - Early Career`
`18:45 - The Big Pivot`
If they don't do this, their YouTube video lacks chapters, hurting SEO and viewer retention.

### 🚀 Proposed Solution
**What:**
Add a new API endpoint `/api/chapters` that takes the full transcript segments and prompts the LLM to generate a structured list of chapters. Add a "Generate Chapters" button on the frontend that displays these timestamps and allows easy copying.

**How it works:**
1. **Data:** Send the `segments` array to the existing GPT-4o integration.
2. **Prompting:** Instruct the LLM to identify major topic shifts and output an array of chapters with `title`, `summary`, and `startTime`.
3. **Frontend:** Display a timeline list of chapters. Include a "Copy for YouTube" button that formats the output exactly as YouTube requires (starting with `00:00`).

**Why this approach:**
- **High ROI:** Uses the existing OpenAI integration and transcript data. Minimal backend changes required.
- **Natural Fit:** Perfectly complements the "Highlights" feature. Highlights are for social media; Chapters are for the main platform (YouTube/Spotify).

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Existing OpenAI SDK (`src/app/api/highlights/route.ts` pattern).
- **Maturity:** Text summarization and segmentation is a highly mature use case for LLMs.
- **Token Limits:** GPT-4o's 128k context window easily handles transcripts for 3-4 hour podcasts.

**Competitive Analysis:**
- **Descript:** Offers AI chapter generation.
- **Riverside.fm:** Offers "Magic Notes" and chapters.
- **OpusClip:** Generates show notes alongside viral clips.
- **Our App:** Currently missing this essential metadata feature.

**Best Practices:**
- YouTube requires the first chapter to start exactly at `00:00`.
- Chapters must be at least 10 seconds long.
- Minimum of 3 chapters per video.

### 🧪 Proof of Concept

**Implementation:**
A POC script was tested in `research/pocs/youtube-chapters-poc.ts` simulating the prompt and output format.

```typescript
// research/pocs/youtube-chapters-poc.ts
const prompt = `Analyze this transcript and generate YouTube chapters...`;
// Simulated LLM Output:
/*
00:00 - Introduction to AI
01:30 - Machine Learning Basics
05:45 - Neural Networks Deep Dive
15:20 - The Future of AI & Conclusion
*/
```

**Performance:**
Generating chapters takes a single LLM call (approx. 5-10 seconds depending on transcript length). Since it runs asynchronously, it won't block the UI.

### 📈 Value Proposition

**Benefits:**
- ✅ **Complete Workflow:** Users get both social clips (highlights) and main video metadata (chapters) in one tool.
- ✅ **SEO Boost:** YouTube chapters improve search visibility for the creator.
- ✅ **Time Saved:** Replaces 30+ minutes of manual scrubbing per episode.

**User stories:**
- As a YouTuber, I want to automatically generate timestamps for my video so I can paste them directly into my video description.

### ⚖️ Trade-offs

**Pros:**
- ✅ Very low implementation effort (re-uses existing AI pipeline).
- ✅ High perceived value by users.

**Cons:**
- ❌ **API Cost:** Adds another LLM call for the full transcript, increasing OpenAI costs per project. (Mitigation: Use a cheaper model like `gpt-4o-mini` for this specific task since it's just summarization).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Rule-based clustering (TF-IDF) | Free, fast | Inaccurate, poor titles | Not chosen |
| `gpt-4o-mini` | 10x cheaper | Slightly less nuance | Recommended for this feature |

### 🛠️ Implementation Plan

**Phase 1: Backend Endpoint** (estimated: 1 day)
- [ ] Create `src/app/api/chapters/route.ts`.
- [ ] Define Zod schema for response `z.array(z.object({ time: z.string(), title: z.string() }))`.
- [ ] Implement OpenAI call using `gpt-4o-mini` to save costs.

**Phase 2: Frontend Integration** (estimated: 1 day)
- [ ] Add a "Chapters" tab next to "Highlights" and "Decupagem".
- [ ] Build a `ChaptersList` component to display the results.
- [ ] Add "Copy for YouTube" utility function.

**Total estimated effort:** 2 developer-days

**Dependencies:**
- None (uses existing OpenAI package).

**Risks:**
- ⚠️ **Token Limits:** Extremely long podcasts (>5 hours) might exceed context.
  - *Mitigation:* Truncate or use a sliding window if necessary, though 128k tokens is usually enough for ~15 hours of spoken English.

### 📚 Resources

**Documentation:**
- [YouTube Chapter Guidelines](https://support.google.com/youtube/answer/9884579?hl=en)

### 🎬 Next Steps

**If approved:**
1. Create the `api/chapters` route using `gpt-4o-mini`.
2. Build the basic UI tab in the project page.

### 💬 Discussion Points
- Should we automatically generate chapters when the transcript is finished, or require a manual button click to save API costs?