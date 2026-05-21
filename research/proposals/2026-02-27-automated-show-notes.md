## 🔬 Researcher: Automated Show Notes Generation

### 🎯 Executive Summary
Implement a feature to automatically generate structured "Show Notes" (Executive Summary, Chapters, Key Learnings, and Quotes) from transcriptions using existing AI integrations (Gemini or OpenAI). This adds a highly valuable, user-facing content repurposing tool with very low technical complexity.

### 💡 Problem Statement
**Current situation:**
The application successfully transcribes audio and generates viral video highlights. However, podcasters and content creators also need written summaries and timestamps (Show Notes) for YouTube descriptions, blog posts, and podcast aggregators (Spotify, Apple Podcasts). Currently, users must manually read the transcript and write these summaries themselves.

**User impact:**
- Content creators spend 30-60 minutes writing summaries and finding timestamps for every episode.
- The platform is missing an opportunity to provide a complete "post-production suite" (Video + Written content).

**Example scenario:**
A podcaster uploads a 1-hour interview, gets video highlights, but then still needs to manually scrub through the audio or read the raw transcript to write YouTube chapters and a blog summary.

### 🚀 Proposed Solution
**What:**
Add a "Generate Show Notes" button that uses an LLM to process the transcript and output a structured Markdown document.

**How it works:**
1. A new API endpoint `/api/show-notes` is created.
2. It aggregates the transcript segments and formats them with timestamps.
3. It sends a structured prompt to Gemini (preferred for speed/cost via `src/lib/gemini-client.ts`) or OpenAI.
4. The LLM generates a Markdown output containing: Executive Summary, Chapters/Timestamps, Key Insights, and Quotes.
5. The UI displays the Markdown, allowing the user to copy or export it.

**Why this approach:**
- It leverages existing API clients (`GeminiClient`).
- It builds upon the existing transcription data without requiring new complex data pipelines.
- "Text-to-text" processing is extremely reliable and fast compared to video/audio manipulation.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Existing `src/lib/gemini-client.ts` (Gemini 2.0 Flash) or OpenAI.
- **Maturity:** Highly stable.
- **Adoption:** Standard feature in tools like Descript, Riverside, and Castmagic.
- **Complexity:** Very Low. It's essentially a new prompt engineering task and UI component.

**Competitive Analysis:**
- **Castmagic:** Entirely built around generating text assets (show notes, tweets) from transcripts. Highly popular.
- **Riverside.fm:** Offers "Magic Notes" directly after recording.

**Best Practices:**
- Use Gemini 1.5/2.0 Flash for very long transcripts due to its massive context window (1M+ tokens) and low cost, avoiding the need for complex chunking logic that might be required with older OpenAI models.

### 🧪 Proof of Concept

**Implementation:**
A simple script was created (`research/pocs/show-notes-poc.ts`) to validate the prompt structure and timestamp mapping.

```typescript
function buildShowNotesPrompt(segments: Segment[]): string {
  const transcriptText = segments
    .map(s => `[${formatTimestamp(s.start)}] ${s.text}`)
    .join('\n');

  return `Você é um assistente especializado em criar "Show Notes"...
Baseado na transcrição abaixo, gere um resumo estruturado em Markdown...`;
}
```

**Performance:**
- Prompt generation is instant.
- LLM inference (Gemini Flash) takes ~3-5 seconds for a typical podcast.

### 📈 Value Proposition

**Benefits:**
- ✅ **Massive Time Savings:** Turns a 30-minute chore into a 5-second action.
- ✅ **Increased Platform Value:** Transitions the app from just a "Highlight Generator" to a "Complete Content Repurposing Tool".
- ✅ **Low Engineering Cost:** Reuses existing APIs and data structures.

**User stories:**
- As a podcaster, I want to automatically generate YouTube chapters with timestamps so I don't have to manually scrub the video.
- As a content manager, I want an executive summary of the episode to quickly post on the company blog.

### ⚖️ Trade-offs

**Pros:**
- ✅ Very easy to implement.
- ✅ High perceived value by users.
- ✅ Uses existing dependencies.

**Cons:**
- ❌ Adds marginal API cost (though Gemini Flash is extremely cheap/free tier).
- ❌ LLM might hallucinate timestamps if prompt is not strict.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side LLM (Transformers.js) | Free, private | Too heavy/slow for summarization | Not chosen. Stick to server API. |

### 🛠️ Implementation Plan

**Phase 1: API Endpoint** (estimated: 0.5 days)
- [ ] Create `src/app/api/show-notes/route.ts`.
- [ ] Implement prompt construction using `transcription segments`.
- [ ] Connect to `GeminiClient`.

**Phase 2: UI Integration** (estimated: 1 day)
- [ ] Create a `ShowNotesPanel` component (similar to `ConfigPanel` for highlights).
- [ ] Add a loading state and Markdown renderer for the result.
- [ ] Add "Copy to Clipboard" and "Export to .md" buttons.

**Phase 3: Polish** (estimated: 0.5 days)
- [ ] Fine-tune the prompt to ensure strict adherence to provided timestamps.

**Total estimated effort:** 2 developer-days

**Dependencies:**
- None new (uses existing `gemini-client.ts`).

**Risks:**
- ⚠️ **Timestamp Hallucination:** The LLM might invent timestamps. *Mitigation: Strict prompting ("Use ONLY the exact timestamps provided in the brackets").*

### 🎬 Next Steps

**If approved:**
1. Create the API endpoint.
2. Build the basic UI to trigger the generation.
3. Test with a long podcast transcript to verify context window handling.
