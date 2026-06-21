## 🔬 Researcher: Speaker Diarization Integration

### 🎯 Executive Summary
I propose integrating Speaker Diarization into the transcription pipeline using Deepgram. This feature will identify 'who spoke when' in multi-speaker audio (e.g., interviews, panel discussions), allowing highlights to be filtered, styled, and analyzed by individual speakers.

### 💡 Problem Statement
**Current situation:**
The current transcription output via Groq Whisper provides a continuous block of text without differentiating between speakers.

**User impact:**
For podcasts with guests or co-hosts, users cannot easily visually distinguish or programmatically separate the dialog. This makes finding specific quotes from a guest tedious and prevents features like "Generate highlights of the guest only."

**Example scenario:**
A creator wants to extract the top 3 insights from their guest in a 1-hour interview. Currently, the AI highlight generator receives a blob of text and might select a highlight where the host is just setting up a question, because the speaker context is lost.

### 🚀 Proposed Solution
**What:**
Transition from Groq Whisper to Deepgram for transcription to unlock native, high-accuracy speaker diarization, or run a secondary diarization model (like Pyannote) alongside Groq. Deepgram is recommended for its speed and developer experience.

**How it works:**
1. Send the audio file to Deepgram's API with `diarize: true`.
2. Deepgram returns word-level timestamps with a `speaker` integer ID.
3. Process the word array into contiguous speaker segments (as demonstrated in the POC).
4. Store these segments in the database, mapping `speaker: 0` to "Speaker A", `speaker: 1` to "Speaker B".
5. Update the transcript component to render speaker labels and distinct colors.

**Why this approach:**
Provides immediate value to interview/podcast creators by adding critical structure to the raw text. Deepgram's API is specifically designed for this and is heavily adopted in the creator economy space.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Deepgram Nova-2 API.
- **Maturity:** Stable, industry leader for diarization.
- **Adoption:** Used by Spotify, Podcastle, and Riverside.
- **Alternatives:**
  - *Groq Whisper:* Fast, but Whisper inherently lacks robust native diarization without complex multi-model pipelines.
  - *AssemblyAI:* Excellent diarization, but generally slower than Deepgram.

**Competitive Analysis:**
- **Descript:** Core feature. Users can assign names to speakers, and the script is formatted like a screenplay.
- **Riverside:** Automatically separates tracks and transcripts by speaker.

### 🧪 Proof of Concept

**Implementation:**
The POC (`research/pocs/diarization_poc.ts`) successfully demonstrates parsing Deepgram's word-level diarization payload into our required `TranscriptionSegment` format.

```typescript
// Example POC output converting Deepgram words to segments
[
  {
    "start": 0.1,
    "end": 2.5,
    "text": "Hello everyone welcome to the podcast.",
    "speaker": 0
  },
  {
    "start": 2.8,
    "end": 4,
    "text": "Thanks for having me.",
    "speaker": 1
  }
]
```

### 📈 Value Proposition

**Benefits:**
- ✅ **Faster Editing:** Visually scan transcripts for guest answers.
- ✅ **Smarter Highlights:** Pass speaker context to GPT-5 so it can prioritize the guest's quotes over the host's questions.
- ✅ **Future Feature Unlock:** "Speaker Name Mapping" (let users type "Host" and "Guest" to replace Speaker A/B).

**User stories:**
- As a creator editing an interview, I want to see speaker labels so I can quickly find the guest's quotes.
- As a highlight engine, I need to know who is speaking so I don't clip a highlight that starts halfway through a sentence.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massive UX improvement for the primary use case (podcasts/interviews).

**Cons:**
- ❌ **API Migration:** Requires moving away from Groq for transcription, which might affect cost or speed depending on volume.
- ❌ **Accuracy:** Diarization models can occasionally mix up similar-sounding voices.

### 🛠️ Implementation Plan

**Phase 1: API Migration & Types** (estimated: 2 days)
- [ ] Implement Deepgram SDK in `/api/transcribe`.
- [ ] Update `TranscriptionSegment` interface to include `speakerId?: string`.
- [ ] Implement the `convertDeepgramToSegments` utility from the POC.

**Phase 2: UI Updates** (estimated: 1 day)
- [ ] Update `transcript-viewer.tsx` to group adjacent segments by the same speaker.
- [ ] Add visual indicators (colored avatars or labels) for Speaker A, Speaker B, etc.

**Phase 3: Highlight Engine Integration** (estimated: 1 day)
- [ ] Update the GPT prompt in `/api/highlights` to include the speaker format (e.g., "Speaker A: [text]").

**Total estimated effort:** 4 developer-days

### 📚 Resources
- [Deepgram Diarization Docs](https://developers.deepgram.com/docs/diarization)

### 🎬 Next Steps
1. Create a Deepgram account and get a test API key.
2. Run a full 1-hour interview through the Deepgram API to verify accuracy and speed compared to Groq.
