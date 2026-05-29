## 🔬 Researcher: Content Repurposing (Show Notes & Social Media)

### 🎯 Executive Summary
Leverage the existing OpenAI integration to automatically generate Show Notes and Social Media posts (Twitter threads, LinkedIn posts) directly from the transcript. This adds massive value for creators by automating post-production tasks without requiring new dependencies or major architectural changes.

### 💡 Problem Statement
**Current situation:**
The application successfully transcribes audio and extracts highlights, but users still have to manually write descriptions, show notes, and promotional content for social media based on the transcript.

**User impact:**
Content creators spend significant time on post-production content creation. Every podcast episode or video needs accompanying text.

**Example scenario:**
A podcaster uploads an episode, gets the transcript and highlights, but then has to switch to ChatGPT, paste the transcript manually (often hitting length limits), and prompt it to generate show notes and a Twitter thread.

### 🚀 Proposed Solution
**What:**
Add a "Repurpose Content" feature that uses the full transcript to automatically generate:
1. Structured Show Notes (Summary, Timestamps, Links).
2. Social Media Posts (Twitter threads, LinkedIn posts).

**How it works:**
- Create a new API endpoint `/api/repurpose` that accepts the transcript and desired output format.
- Use the existing OpenAI client to prompt GPT-4o (or another suitable model).
- Add a new UI tab or section in the application to trigger and view the generated content.
- Support markdown export for the generated content.

**Why this approach:**
- It leverages the existing technical stack (OpenAI integration is already built).
- It provides high perceived value for users with minimal technical complexity.
- It perfectly aligns with the product's goal of streamlining the audio/video workflow.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Existing OpenAI SDK.
- **Maturity:** Stable.
- **Dependencies:** None (reuses existing).

**Competitive Analysis:**
- Tools like Riverside, Descript, and OpusClip are adding these features as premium offerings. It's becoming table stakes for AI audio/video tools.

### 🧪 Proof of Concept

**Implementation:**
```javascript
// A simple Node.js script demonstrating the prompting logic
// Located at research/pocs/content_repurposing_poc.mjs
```

**Demo:**
The POC successfully generates formatted Show Notes and a Twitter thread based on a mock transcript.

### 📈 Value Proposition

**Benefits:**
- ✅ **Huge Time Savings:** Automates 30-60 minutes of manual work per episode.
- ✅ **All-in-One Tool:** Keeps the user within the application ecosystem.
- ✅ **Low Effort, High Reward:** Uses existing API infrastructure for a major feature.

**User stories:**
- As a podcaster, I can click a button to generate show notes with timestamps so that I can immediately publish my episode to Spotify.
- As a content creator, I can generate a Twitter thread from my video transcript to promote my content.

### ⚖️ Trade-offs

**Pros:**
- ✅ Very low implementation complexity.
- ✅ High user value.
- ✅ Reuses existing architecture.

**Cons:**
- ❌ Increases OpenAI API usage/costs per user.
- ❌ Handling very long transcripts might require chunking strategies similar to the search feature to fit within token limits.

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 day)
- [ ] Create `/api/repurpose` endpoint.
- [ ] Define Zod schemas for the request/response.
- [ ] Write the system prompts for Show Notes and Twitter threads.

**Phase 2: Core Feature** (estimated: 1 day)
- [ ] Build the UI component (e.g., a "Repurpose" tab next to "Highlights" or "Transcript").
- [ ] Connect UI to the new API endpoint.
- [ ] Implement loading states and error handling.

**Phase 3: Polish & Testing** (estimated: 1 day)
- [ ] Add copy/export buttons for the generated text.
- [ ] Write tests for the API endpoint.

**Total estimated effort:** 3 developer-days

**Dependencies:**
- None (uses existing OpenAI package).

**Risks:**
- ⚠️ **Token Limits:** Full transcripts of very long podcasts might exceed context windows.
  - *Mitigation:* Implement chunking or use models with larger context windows (e.g., `gpt-4o`).

### 🎬 Next Steps

**If approved:**
1. Finalize the specific formats to support (e.g., Show Notes, Twitter, LinkedIn).
2. Draft the exact system prompts.
3. Begin Phase 1 implementation.

### 📚 Resources

**Documentation:**
- [OpenAI Text Generation Docs](https://platform.openai.com/docs/guides/text-generation)
- [Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)

**Examples:**
- [Podcast Show Notes Examples](https://castos.com/podcast-show-notes/)
- [Twitter Thread Examples](https://blog.hootsuite.com/twitter-threads/)

### 💬 Discussion Points
- Should we offer templates (e.g., "Professional", "Casual") for the generated text?
- Where in the UI should this feature live? Should it be a new tab next to "Highlights"?
- How do we handle extremely long transcripts that might exceed the token limits of our default model?
