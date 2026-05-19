## 🔬 Researcher: Automated Show Notes Generation

### 🎯 Executive Summary
Propose adding an "Automated Show Notes" feature that utilizes our existing OpenAI dependency to generate high-quality, formatted show notes from podcast transcriptions. This low-effort, high-value feature leverages code and API endpoints we already have to significantly increase user value for podcasters.

### 💡 Problem Statement
**Current situation:**
The application currently generates accurate transcriptions and cuts highlights for clips, but leaves podcasters to manually write their episode summaries, key takeaways, and timestamped show notes.

**User impact:**
Content creators spend an additional 30-60 minutes post-editing to draft show notes for Spotify, Apple Podcasts, and YouTube descriptions.

**Example scenario:**
A podcaster uploads a 45-minute episode. The app transcribes it and pulls viral clips. However, when publishing the full episode, the podcaster still has to re-read or re-listen to write out the description and find timestamps for the main topics.

### 🚀 Proposed Solution
**What:**
Add a "Generate Show Notes" button next to the transcription view that triggers a new API endpoint (`POST /api/show-notes`). This endpoint will send the existing transcription to OpenAI to format into structured show notes.

**How it works:**
1. A new `POST /api/show-notes` endpoint is created using the existing OpenAI Node.js SDK setup.
2. The endpoint receives the full transcript (or chunked transcript for very long episodes) and a specific system prompt instructing the model to generate a summary, key takeaways, and timestamps.
3. The response is returned and displayed in a new Markdown-rendered UI component, allowing the user to copy it to their clipboard or export it.

**Why this approach:**
- We already have the OpenAI SDK configured and integrated.
- We already possess the accurate, timestamped transcription data.
- The technical complexity is extremely low (just a new prompt and endpoint), while the perceived value to the user is very high.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** OpenAI Node.js SDK (already installed `^6.16.0`)
- **Model:** `gpt-4o` or `gpt-4o-mini` (fast, capable of long-context summarization)
- **Maturity:** Stable

**Competitive Analysis:**
- **Descript:** Offers AI show notes generation.
- **Riverside.fm:** Offers "Magic Notes" including summaries and chapters.
- **Our App:** Currently lacks automated show notes, putting us at a competitive disadvantage for end-to-end podcast workflows.

**Best Practices:**
- Send timestamps alongside text to the LLM to ensure accurate chapter generation.
- Use structured output or clear Markdown prompt instructions to guarantee consistent formatting.

### 🧪 Proof of Concept

**Implementation:**
A mock POC demonstrates the desired output structure given a transcript with timestamps.

```javascript
// See research/pocs/show-notes-poc.js for the implementation
const systemPrompt = `You are an expert podcast producer. Create professional show notes from the provided transcript.
Include:
1. A brief summary (2-3 sentences).
2. Key takeaways (3 bullet points).
3. Timestamps for main topics.
Format as Markdown.`;
```

**Demo Output:**
```markdown
## Episode Summary
In this episode, Alice and Bob dive into the rapidly evolving landscape of AI...

## Key Takeaways
- **Generative AI in Development:** AI tools are transforming coding...
- **Augmentation over Replacement:** AI serves as a pair programmer...

## Timestamps
- **00:00:00** - Introduction and the biggest trends in AI.
- **00:00:12** - Generative AI and its impact...
```

**Performance:**
- Latency depends on OpenAI API response time (typically 2-5 seconds for text generation).
- Minimal additional client-side load.

### 📈 Value Proposition

**Benefits:**
- ✅ **Saves Time:** Eliminates manual typing of show notes.
- ✅ **Increases Utility:** Makes the platform an all-in-one podcasting tool.
- ✅ **Low Cost/Effort:** Reuses existing transcription data and API infrastructure.

**User stories:**
- As a **podcaster**, I can **generate show notes instantly from my transcript**, so that **I can publish my episodes faster with high-quality descriptions.**

### ⚖️ Trade-offs

**Pros:**
- ✅ Extremely fast to implement (1-2 days max).
- ✅ High user value.
- ✅ No new dependencies required.

**Cons:**
- ❌ Adds marginal cost to OpenAI API usage per generation.
- ❌ Context window limits for very long episodes (>2 hours) might require a chunked summarization approach.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side generation (Transformers.js) | Free, private | Too slow/heavy for large context summarization on client | Not chosen |
| Dedicated 3rd party API for summaries | Pre-built | Adds new vendor and dependency | Not chosen |

### 🛠️ Implementation Plan

**Phase 1: Backend Integration** (estimated: 1 day)
- [ ] Create `src/app/api/show-notes/route.ts`.
- [ ] Implement OpenAI call with the specific system prompt.
- [ ] Handle token limits (truncate or chunk if necessary).

**Phase 2: Frontend UI** (estimated: 1 day)
- [ ] Add "Generate Show Notes" button to the transcription view.
- [ ] Create a modal or side-panel to display the generated Markdown.
- [ ] Add "Copy to Clipboard" and "Export to Markdown" options.

**Total estimated effort:** 2 developer-days

**Risks:**
- ⚠️ **Context Window Exceeded:** Transcripts for 3-hour podcasts might exceed the token limit.
  - *Mitigation:* Implement a chunked summary approach (summarize chunks, then summarize the summaries) or use a model with a larger context window (e.g., `gpt-4o`).

### 📚 Resources

**Documentation:**
- [OpenAI Text Generation Docs](https://platform.openai.com/docs/guides/text-generation)

### 🎬 Next Steps

**If approved:**
1. Create the backend `/api/show-notes` endpoint.
2. Design the UI component for displaying and copying the notes.

### 💬 Discussion Points
- Should we allow users to customize the prompt for the show notes (e.g., "Add a call to action at the end")?
- Which model (`gpt-4o-mini` vs `gpt-4o`) offers the best balance of cost and quality for this specific task?