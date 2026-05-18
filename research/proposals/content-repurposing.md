## 🔬 Researcher: Content Repurposing Feature (Social Media Posts from Transcripts)

### 🎯 Executive Summary
Leverage the existing OpenAI integration to allow users to generate repurposed content, such as Tweets and LinkedIn posts, directly from selected transcript segments. This low-effort, high-value addition provides a new set of deliverables beyond standard highlights, increasing the utility and retention of the application.

### 💡 Problem Statement
**Current situation:**
The platform currently identifies "highlights" and generates video clips, but users manually have to write their own social media copy to promote these clips.

**User impact:**
- **Friction:** Creating engaging copy for different platforms (Twitter, LinkedIn) is time-consuming and often requires switching to another tool like ChatGPT.
- **Lost Opportunity:** Podcasters and creators need multi-format content to maximize reach. Providing only clips solves half their problem.

**Example scenario:**
A user generates a great 60-second clip about "the future of AI." To share it, they must re-listen, draft a tweet, find relevant hashtags, and write a longer, discussion-focused LinkedIn post.

### 🚀 Proposed Solution
**What:**
Add a "Repurpose" button to individual highlights (or transcript segments) that instantly generates platform-optimized copy (Twitter/X, LinkedIn) based on the transcript text.

**How it works:**
1.  **UI Addition:** A "Generate Social Copy" button on the `HighlightCard` or a new tab in the `TranscriptViewer`.
2.  **API Integration:** Create a new endpoint (e.g., `/api/repurpose`) that uses the existing `openai` SDK to call `gpt-4o-mini`.
3.  **Prompt Engineering:** The API instructs the model to format the segment text into specific social media structures (JSON output with `tweet` and `linkedin` fields).
4.  **Display:** Present the generated text in a modal with a "Copy to Clipboard" button.

**Why this approach:**
- **Zero Architectural Change:** Uses the already configured and integrated OpenAI SDK.
- **Low Cost:** Can use `gpt-4o-mini` since the task (formatting text) is simple, keeping API costs negligible.
- **High Value:** Solves a direct user pain point with minimal development effort.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Existing `openai` SDK (v6.16.0).
- **Maturity:** Stable.
- **Dependencies:** None required (uses existing stack).

**Competitive Analysis:**
- **Product A (OpusClip):** Generates AI titles and descriptions, but users often want more diverse social copy.
- **Product B (Riverside.fm):** Generates show notes and social posts. This is becoming table stakes for podcast tools.
- **Our App:** Currently lacks native text repurposing.

**Best Practices:**
- Force JSON output from OpenAI (`response_format: { type: "json_object" }`) for predictable UI rendering.
- Keep the prompt specific regarding constraints (e.g., "under 280 characters for Twitter").

### 🧪 Proof of Concept

**Implementation:**
The core logic was validated in a standalone script (`research/pocs/content-repurposing.ts`).

```typescript
// Sample implementation demonstrating the prompt structure
const prompt = \`You are an expert social media manager. I will provide a snippet from a podcast transcript.
Please repurpose this content into two formats:
1. A concise, engaging Twitter post (under 280 characters) using appropriate hashtags.
2. A professional, insightful LinkedIn post that expands slightly on the core idea to encourage discussion.

Format the output strictly as JSON:
{
  "tweet": "The tweet text here...",
  "linkedin": "The LinkedIn post text here..."
}

Transcript Snippet:
\${sampleTranscript}
\`;

const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
        { role: "system", content: "You are a specialized assistant that reformats text into social media posts. Always return valid JSON." },
        { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
});
```

### 📈 Value Proposition

**Benefits:**
- ✅ **Increased User Engagement:** Provides an immediate "Aha!" moment beyond just audio/video cutting.
- ✅ **Workflow Consolidation:** Keeps users in the app instead of bouncing to ChatGPT.
- ✅ **Low Technical Risk:** Uses existing infrastructure and libraries.

**User stories:**
- As a podcaster, I can generate a tweet thread directly from a 2-minute transcript segment so that I can immediately promote my new episode.

### ⚖️ Trade-offs

**Pros:**
- ✅ Fast implementation time (1-2 days).
- ✅ Reuses existing OpenAI setup.
- ✅ Clear, demonstrable value to the end user.

**Cons:**
- ❌ Small incremental cost for API calls (though `gpt-4o-mini` is very cheap).
- ❌ Requires adding a bit more UI complexity to the highlight cards.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side generation (Transformers.js) | Free, private | Too complex for simple text generation, large models needed for good copy | Not chosen |
| Generate copy during highlight creation | Zero extra clicks | Might generate copy users don't want, wasting tokens | Not chosen (opt-in generation is better) |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 0.5 days)
- [ ] Create `/api/repurpose/route.ts` endpoint using the POC logic.
- [ ] Define Zod schemas for request validation (segment text, desired platforms).

**Phase 2: Core Feature** (estimated: 1 day)
- [ ] Add "Generate Social Copy" button to the UI (e.g., inside the `HighlightCard` component).
- [ ] Create a modal or expandable section to display the generated text.

**Phase 3: Polish & Testing** (estimated: 0.5 days)
- [ ] Add loading states and error handling.
- [ ] Implement "Copy to Clipboard" functionality.

**Total estimated effort:** 2 developer-days

**Dependencies:**
- None (uses existing `openai` and UI components).

**Risks:**
- ⚠️ **API Rate Limits/Costs:** High usage could impact costs. Mitigation: Use `gpt-4o-mini` and consider rate limiting the endpoint.

### 🎬 Next Steps

**If approved:**
1. Implement the API endpoint `/api/repurpose`.
2. Design and implement the UI integration in the highlight view.
3. Test with various transcript lengths to fine-tune the prompt.

**Questions to resolve:**
- [ ] Should we allow users to customize the prompt or provide generic "tones" (e.g., professional, casual)?
- [ ] How should we handle very long transcript segments that exceed character limits for social media?

### 📚 Resources

**Documentation:**
- [OpenAI Text Generation Docs](https://platform.openai.com/docs/guides/text-generation)
- [Twitter API Character Counting](https://developer.twitter.com/en/docs/counting-characters)

**Examples:**
- [Riverside.fm Magic Clips (Similar Feature)](https://riverside.fm)

**Community:**
- [Discussion on AI Content Repurposing](https://github.com/openai/openai-node/discussions)

### 💬 Discussion Points
- Do we want to expand this to other formats later (e.g., blog post outlines, newsletter summaries)?
- Is `gpt-4o-mini` sufficient for tone control, or do we need a more capable model?
