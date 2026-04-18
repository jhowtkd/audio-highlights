## 🔬 Researcher: Speaker Diarization Integration

### 🎯 Executive Summary
This proposal recommends integrating Speaker Diarization into our transcription pipeline. By identifying and labeling different speakers (e.g., "Speaker A", "Speaker B"), we can generate more contextual highlights and provide a significantly improved transcript reading experience for interviews and multi-host podcasts.

### 💡 Problem Statement
**Current situation:**
Our current transcription pipeline uses the Groq Whisper API, which provides accurate text and word-level timestamps but does not distinguish between different speakers.

**User impact:**
For podcasts with multiple hosts or interviews, the transcript reads as a single monologue. This makes it difficult for users to assign context or extract quotes accurately, as they cannot visually distinguish who is speaking without listening to the audio.

**Example scenario:**
A user uploads a 45-minute interview. They want to create a highlight of the guest's specific answer to a question. In the transcript viewer, the host's question and the guest's answer run together in the same paragraph block, making it hard to find the exact start and end points of the guest's speech.

### 🚀 Proposed Solution
**What:**
Enhance the transcription process by adding a speaker diarization step, either by using a Whisper model that supports diarization (like WhisperX) or by running a parallel diarization model (like PyAnnote) and mapping the results to our existing Whisper segments.

**How it works:**
1. The audio is sent to the transcription API as usual.
2. A diarization model analyzes the audio to detect speaker changes and produces time-stamped speaker segments.
3. The speaker segments are aligned with the text segments based on timestamps.
4. The frontend `TranscriptViewer` is updated to display speaker labels and use different colors/avatars for different speakers.

**Why this approach:**
Speaker separation is a standard feature in premium transcription services. Implementing it adds significant professional value and unlocks new AI highlight generation capabilities (e.g., "Generate highlights only from Speaker B").

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** WhisperX (incorporates PyAnnote for diarization) or Groq API (if diarization becomes supported natively) or AssemblyAI/Deepgram API.
- **Maturity:** Stable (Diarization is a well-established ML task).
- **Adoption:** Standard in tools like Descript, Otter.ai, and Riverside.
- **Complexity:** High if implemented locally (requires heavy models like PyAnnote). Medium if using a managed API like AssemblyAI.

**Competitive Analysis:**
- **Descript:** Full speaker diarization with voice profiling.
- **Otter.ai:** Automatic speaker identification.
- **Our App:** Currently lacks speaker identification.

**Best Practices:**
- Allow users to manually rename speakers (e.g., "Speaker 1" -> "John Doe").
- Visually group consecutive segments from the same speaker.

### 🧪 Proof of Concept

**Implementation:**
A simple POC demonstrating the data structure and basic alignment logic is located at `research/pocs/speaker-diarization-poc.ts`.

```typescript
// See research/pocs/speaker-diarization-poc.ts for full code
interface DiarizedSegment {
  start: number;
  end: number;
  text: string;
  speaker: string;
}
```

**Demo:**
The POC outputs a clean, speaker-labeled log of transcription segments, showing how the frontend will receive the data.

**Performance:**
- Before: Monolithic text blocks.
- After: Clear, conversational text layout.
- Impact: Huge improvement in readability and highlight selection accuracy.

### 📈 Value Proposition

**Benefits:**
- ✅ **Improved Readability:** Transcripts look like actual conversations.
- ✅ **Better Highlights:** AI can be instructed to focus on the "guest" rather than the "host".
- ✅ **Professional UX:** Matches features of premium paid tools.

**User stories:**
- As a podcast editor, I want to see who is speaking so I can easily find and extract quotes from my guest.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massive UX improvement for interviews.
- ✅ Enables advanced AI prompting for highlights.

**Cons:**
- ❌ Might increase transcription processing time if running an extra model.
- ❌ PyAnnote and WhisperX require more compute resources than standard Whisper.
- ❌ Requires UI updates to support speaker labels and renaming.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Deepgram/AssemblyAI** | Built-in diarization, very fast | Higher cost, vendor lock-in | Could be considered if Groq doesn't add support |
| **Local PyAnnote** | Free | High compute cost, complex to host | Not chosen |

### 🛠️ Implementation Plan

**Phase 1: API Evaluation** (estimated: 3 days)
- [ ] Evaluate managed APIs (AssemblyAI/Deepgram) vs open-source (WhisperX) for diarization.
- [ ] Prototype backend integration to align diarization data with current Groq Whisper output.

**Phase 2: Data Structure & Backend** (estimated: 2 days)
- [ ] Update `TranscriptionSegment` type to include `speakerId`.
- [ ] Modify the `/api/transcribe` endpoint to return speaker data.

**Phase 3: Frontend UI** (estimated: 3 days)
- [ ] Update `TranscriptViewer` to display speaker labels.
- [ ] Add UI for users to rename speakers.
- [ ] Update highlight generation prompt to leverage speaker context.

**Total estimated effort:** 8 developer-days

**Dependencies:**
- Diarization API or Model.

**Risks:**
- ⚠️ **Accuracy:** Diarization models can struggle with overlapping speech.
  - *Mitigation:* Allow manual correction of speaker labels in the UI.
- ⚠️ **Cost/Latency:** Adding a second model increases both.
  - *Mitigation:* Consider moving entirely to an API that provides both transcription and diarization natively.

### 📚 Resources

**Documentation:**
- [WhisperX GitHub](https://github.com/m-bain/whisperX)
- [PyAnnote Audio](https://github.com/pyannote/pyannote-audio)

### 🎬 Next Steps

**If approved:**
1. Determine if we want to switch from Groq Whisper to a provider that supports diarization (like Deepgram) or run WhisperX on our Railway microservice.
2. Update the transcription database schema to support speaker metadata.

### 💬 Discussion Points
- Should we switch transcription APIs entirely to one that supports diarization out-of-the-box, or try to run diarization parallel to our Groq Whisper implementation?