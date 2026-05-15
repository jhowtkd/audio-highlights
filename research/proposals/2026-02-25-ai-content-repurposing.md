## 🔬 Researcher: AI Content Repurposing Engine

### 🎯 Executive Summary
I propose adding an **AI Content Repurposing Engine** to the application. This feature will automatically generate written content like Twitter threads, LinkedIn posts, and Blog articles directly from the podcast transcript and generated highlights. This transforms the app from a simple video clipping tool into a comprehensive content marketing hub for podcasters.

### 💡 Problem Statement
**Current situation:**
The application generates short video clips (highlights) and provides basic summaries and titles. However, podcasters and content creators also need written content to promote their episodes across different social media platforms. Currently, they have to copy the transcript, open ChatGPT in a separate tab, craft a prompt, and manually copy-paste the results back.

**User impact:**
Content creators waste valuable time context-switching between tools and writing repetitive prompts for different social networks.

**Example scenario:**
After generating a viral clip about "AI in Healthcare", a user wants to share it on Twitter and LinkedIn. They currently have to manually write a Twitter thread summarizing the 2-minute clip and a professional LinkedIn post, breaking their workflow.

### 🚀 Proposed Solution
**What:**
A new feature accessible from the Highlight details or the main Project view that generates tailored written content (Twitter Threads, LinkedIn Posts, Blog Posts, Newsletters) based on the transcript.

**How it works:**
- A new API endpoint `/api/repurpose` will be created, leveraging OpenAI's `gpt-4o-mini` (or `gpt-4o`) model.
- The user selects a highlight or the entire transcript, chooses the desired formats (e.g., "Twitter Thread", "LinkedIn Post"), and clicks "Generate Content".
- The frontend will display the generated content in editable text areas with one-click "Copy to Clipboard" buttons.

**Why this approach:**
- **Value Add:** Dramatically increases the perceived value of the application by saving users even more time.
- **Low Effort, High Impact:** We are already utilizing OpenAI for highlight extraction. Repurposing text is a natural and computationally cheap extension.

### 📊 Research Findings

**Technology Analysis:**
- **Model:** OpenAI `gpt-4o-mini` is sufficient for text generation, fast, and very cost-effective.
- **Integration:** Can easily be integrated into the existing `src/app/api/highlights/route.ts` architecture or a new route.

**Competitive Analysis:**
- **OpusClip / Munch:** Primarily focused on video. Written content is secondary.
- **Castmagic / Podium:** These tools excel at written content repurposing from audio. Adding this feature allows our app to compete directly with them.
- **Our App:** Currently focused only on video highlights and text exports.

### 🧪 Proof of Concept

**Implementation:**
A POC script was created in `research/pocs/content-repurposing-poc.ts` to test the prompt and response structure.

```typescript
// research/pocs/content-repurposing-poc.ts (Simplified)
const prompt = `
You are an expert content marketer for podcasters.
Based on the following podcast transcript, generate repurposed content in the requested formats.
Output JSON with the format names as keys and the generated content as values.
...
`;
```

**Demo:**
The POC successfully generated a 4-part Twitter thread and a professional LinkedIn post from a sample transcript about AI in healthcare.
*See the POC script for full output.*

### 📈 Value Proposition

**Benefits:**
- ✅ **All-in-One Workflow:** Users can create both video clips and promotional text in one place.
- ✅ **Time Savings:** Eliminates the need to prompt external AI tools manually.
- ✅ **Cost-Effective:** Text generation with smaller models (like `gpt-4o-mini`) adds negligible cost per project.

**User stories:**
- As a **Podcaster**, I want to **generate a Twitter thread from my 2-minute highlight** so that I can easily promote my new episode on social media.
- As a **Content Marketer**, I want to **turn the entire episode transcript into a blog post** to improve my website's SEO.

### ⚖️ Trade-offs

**Pros:**
- ✅ High perceived value for end-users.
- ✅ Easy to implement using existing OpenAI integration.

**Cons:**
- ❌ **Token Costs:** Although cheap, processing full 1-hour transcripts for a blog post consumes more tokens.
- ❌ **UI Clutter:** Requires adding new UI panels for text editing and format selection.

### 🛠️ Implementation Plan

**Phase 1: Backend Endpoint** (estimated: 1 day)
- [ ] Create `/api/repurpose` route in Next.js.
- [ ] Define Zod schemas for the request (transcript text, formats array).
- [ ] Implement OpenAI prompt and JSON parsing.

**Phase 2: Frontend Integration** (estimated: 2 days)
- [ ] Create a `ContentRepurposer` component in `src/components/highlights/`.
- [ ] Add format selection checkboxes (Twitter, LinkedIn, Blog, Newsletter).
- [ ] Display results in `textarea` components with "Copy" and "Regenerate" buttons.

**Phase 3: Polish** (estimated: 1 day)
- [ ] Add tone selection (Professional, Casual, Humorous).
- [ ] Integrate closely with the existing Highlight Cards (e.g., a "Repurpose this clip" button).

**Total estimated effort:** 4 developer-days

**Dependencies:**
- None (Uses existing `openai` and UI components).

### 🎬 Next Steps

**If approved:**
1. Finalize the prompts for each specific format (Twitter, LinkedIn, etc.) to ensure high quality.
2. Begin Phase 1 (Backend Endpoint).
