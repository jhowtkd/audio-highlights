## 🔬 Researcher: Speaker Diarization Integration

### 🎯 Executive Summary
I propose adding Speaker Diarization (speaker identification) to our transcription pipeline using an API like Deepgram or AssemblyAI. This will allow the application to identify *who* is speaking, which is critical for podcasts with multiple hosts or guests.

### 💡 Problem Statement
**Current situation:**
The current transcription pipeline uses Groq's Whisper API, which provides fast and accurate text but does not natively identify different speakers.

**User impact:**
Users reading the transcript or reviewing highlights have no context on who is speaking. For interviews or multi-host podcasts, the generated text is a single block, making it hard to follow the conversation flow.

**Example scenario:**
A 1-hour interview is transcribed. When the user looks at a generated highlight, they see "I think that's a great idea. Yes, I agree." instead of:
**Speaker 1:** I think that's a great idea.
**Speaker 2:** Yes, I agree.

### 🚀 Proposed Solution
**What:**
Integrate a speech-to-text API that natively supports speaker diarization, such as Deepgram Nova-2, as an alternative or primary transcription engine.

**How it works:**
- The frontend uploads the audio.
- The backend sends the audio to the Deepgram API with `diarize=true`.
- The response includes word-level timestamps and a `speaker` integer ID for each word.
- The `TranscriptionSegment` type is updated to include a `speakerId`.

**Why this approach:**
- **Value:** Speaker labels are a core requirement for podcast editing tools (like Descript).
- **Feasibility:** Deepgram's API is very fast and easy to drop in alongside our existing Groq implementation.

### 📊 Research Findings

**Technology Analysis:**
- **Provider:** Deepgram API (Nova-2 model)
- **Feature:** Speaker Diarization (`diarize=true`)
- **Performance:** extremely fast, on par with Groq.

**Competitive Analysis:**
- **Descript:** Has automatic speaker detection and labeling.
- **Riverside:** Generates transcripts with speaker names.
- **Our App:** Currently lacks speaker identification entirely.

### 🧪 Proof of Concept

**Implementation:**
A simple simulation script (`research/pocs/transcription-diarization-poc.js`) was created to verify the data structure.

```javascript
const dummyResponse = {
  results: {
    channels: [{
      alternatives: [{
        words: [
          { word: "Hello", start: 0.1, end: 0.5, speaker: 0 },
          { word: "World", start: 0.6, end: 1.0, speaker: 1 }
        ]
      }]
    }]
  }
};
```

**Results:**
The data structure maps cleanly to our existing `TranscriptionSegment` type. We just need to group words by speaker to create the segments.

### 📈 Value Proposition

**Benefits:**
- ✅ **Contextual Transcripts:** Makes reading and editing much easier.
- ✅ **Better Highlights:** GPT-4o can use speaker labels to create better summaries and context for highlights.
- ✅ **Professional Parity:** Brings the app up to par with industry-standard tools.

### ⚖️ Trade-offs

**Pros:**
- ✅ High value add for users.
- ✅ Relatively simple API integration.

**Cons:**
- ❌ **Cost:** Requires a paid API (Deepgram), whereas Groq might be cheaper/free depending on the tier.
- ❌ **Accuracy:** Diarization models can sometimes confuse voices if they are similar or overlap heavily.

### 🛠️ Implementation Plan

**Phase 1: Backend Integration** (estimated: 2 days)
- [ ] Add Deepgram SDK and API key to environment.
- [ ] Create a new transcription route or modify the existing one to use Deepgram when requested.
- [ ] Map the Deepgram response to our internal `TranscriptionSegment` format.

**Phase 2: Frontend UI** (estimated: 2 days)
- [ ] Update `TranscriptViewer` to display different colors/labels for different speakers.
- [ ] Allow users to rename "Speaker 0" to "John Doe".

**Total estimated effort:** 4 developer-days

**Dependencies:**
- `@deepgram/sdk`

### 📚 Resources

**Documentation:**
- [Deepgram Diarization Documentation](https://developers.deepgram.com/docs/diarization)

### 🎬 Next Steps

**If approved:**
1. Secure a Deepgram API key for development.
2. Implement the backend route using the Deepgram SDK.

**Questions to resolve:**
- [ ] What is the exact pricing model for Deepgram Nova-2 vs our current Groq usage?
- [ ] Should we support both providers or switch entirely?

### 💬 Discussion Points
- Do we want to allow users to manually correct diarization mistakes in the UI?
- How should we display speaker labels in the exported Markdown/SRT files?