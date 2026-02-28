## 🔬 Researcher: Automated YouTube Chapters & Show Notes Generation

### 🎯 Executive Summary
Propose adding an automated "Show Notes & Chapters" generation feature that leverages the existing transcription and OpenAI integration to automatically create YouTube/Spotify-ready descriptions, timestamped chapters, and SEO metadata. This adds massive value for podcast creators by saving them 30-60 minutes of manual formatting per episode.

### 💡 Problem Statement
**Current situation:**
The application currently transcribes audio and generates excellent viral highlights, but users who publish the full episodes to YouTube or Spotify still need to manually review the audio to write descriptions and create timestamp chapters.

**User impact:**
Podcast editors and creators spend between 30 to 60 minutes per episode just writing show notes and formatting chapters (e.g., `00:00 Intro`, `12:35 Topic A`).

**Example scenario:**
A user uploads a 1-hour podcast, generates 5 clips for Instagram Reels, and exports the SRT. Then, they must open the transcript and manually hunt for the main topic transitions to create the YouTube description and timestamps before publishing the full video.

### 🚀 Proposed Solution
**What:**
Add a new feature in the "Transcrição" or "Highlights" view: a button to "Gerar Show Notes & Capítulos". This will prompt GPT-4o-mini (or GPT-4o) with the full transcript to generate a formatted YouTube description, SEO title, tags, and clickable timestamps.

**How it works:**
- We create a new endpoint `POST /api/shownotes`.
- We send the exact same transcript array (already with timestamps) to OpenAI.
- The prompt instructs the model to act as a YouTube SEO Expert and return a JSON containing `showNotes`, `chapters` (array of `{time, title}`), `seoTitle`, and `tags`.
- The UI will display a new section "Show Notes" where the user can copy the entire block (Title, Description, Chapters) in one click.

**Why this approach:**
- Zero new backend dependencies. We already have the transcription and OpenAI API integrated.
- High ROI: extremely low implementation effort (1-2 days) for a massive workflow improvement for the target audience.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** OpenAI API (GPT-4o-mini)
- **Maturity:** Stable
- **Cost:** Very low cost using `gpt-4o-mini` (fractions of a cent per transcript) compared to the main highlight generation.
- **Bundle size:** Zero impact (Server-side logic only).

**Competitive Analysis:**
- *Riverside.fm / Descript:* Both offer "AI Show Notes" and "Chapters" as premium features.
- *AudioHighlights (Our App):* Currently lacks full episode metadata generation, focusing only on short clips.

**Best Practices:**
- YouTube requires the first chapter to start exactly at `00:00`. The LLM prompt must strictly enforce this.
- Chapter timestamps must be formatted as `MM:SS` or `HH:MM:SS`.

### 🧪 Proof of Concept

**Implementation:**
```typescript
// research/pocs/youtube-chapters-poc.ts
const prompt = \`Você é um especialista em SEO e Copywriting para YouTube.
Sua missão é gerar Capítulos (Timestamps) e Show Notes a partir de uma transcrição de podcast.

## TRANSCRIÇÃO COM TIMESTAMPS
\${sampleTranscript}

## REGRAS PARA CAPÍTULOS
- Identifique os 3 a 5 principais tópicos.
- O primeiro capítulo DEVE obrigatoriamente começar em 00:00.
- Títulos curtos (máximo 50 caracteres) e chamativos (clickbait de SEO).

## FORMATO DE RESPOSTA (JSON PURO)
{
  "showNotes": "Resumo envolvente para a descrição do YouTube em 2 parágrafos.",
  "chapters": [ { "time": "00:00", "title": "Introdução" } ],
  "seoTitle": "Título do vídeo com alto potencial de clique",
  "tags": ["tag1", "tag2"]
}\`;
```

**Performance:**
- Impact: Minimal. Running `gpt-4o-mini` on a transcript takes ~3-5 seconds.

### 📈 Value Proposition

**Benefits:**
- ✅ Saves 30-60 minutes of manual work for creators per episode.
- ✅ Increases the product's value proposition from "clip generator" to "end-to-end podcast assistant".
- ✅ High perceived value for extremely low API cost.

**User stories:**
- As a podcast creator, I can generate show notes and chapters in 1 click so that I can instantly publish my episode to YouTube without manual formatting.

### ⚖️ Trade-offs

**Pros:**
- ✅ Easy to implement (reuse existing UI patterns and API clients).
- ✅ Extremely high value for target users.

**Cons:**
- ❌ Small additional cost per user action (OpenAI API).
- ❌ UI needs to accommodate a new section/tab.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side summarization (Transformers.js) | Free | Hard to enforce strict JSON/Chapters | Not chosen because accuracy in timestamps is critical for YouTube. |

### 🛠️ Implementation Plan

**Phase 1: API Route** (estimated: 0.5 days)
- [ ] Create `src/app/api/shownotes/route.ts` with OpenAI integration and prompt.
- [ ] Add Zod validation schemas.

**Phase 2: UI Component** (estimated: 1 day)
- [ ] Create a `ShowNotesCard` component to display the generated metadata.
- [ ] Add a new Tab "Show Notes" in `TranscriptViewer` or next to Highlights.
- [ ] Add "Copy to Clipboard" functionality formatted exactly for YouTube descriptions.

**Phase 3: Integration** (estimated: 0.5 days)
- [ ] Connect the UI to the API route.
- [ ] Test with large transcripts.

**Total estimated effort:** 2 developer-days

**Dependencies:**
- `openai` (already installed)

**Risks:**
- ⚠️ LLM might format timestamps incorrectly (e.g. `00:00:00` instead of `00:00`). - Mitigation: Add strict instructions in the prompt and backend validation/correction before sending to frontend.

### 📚 Resources

**Documentation:**
- [YouTube Chapter Requirements](https://support.google.com/youtube/answer/9884579?hl=en)
- [OpenAI JSON Mode](https://platform.openai.com/docs/guides/text-generation/json-mode)

### 🎬 Next Steps

**If approved:**
1. Implement the API route `POST /api/shownotes`.
2. Design the UI component for the new "Show Notes" tab.
3. Test with various podcast lengths to ensure prompt stability.

### 💬 Discussion Points
- Should we charge credits for Show Notes generation, or include it for free since it uses a cheaper model?
- Should the "Copy for YouTube" button include our app's branding at the bottom? (e.g. "Chapters generated by AudioHighlights").
