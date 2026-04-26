## 🔬 Researcher: Speaker Diarization Integration

### 🎯 Executive Summary
I propose adding **Speaker Diarization** (speaker identification) to the transcription pipeline using the **Deepgram API** or **AssemblyAI**. This feature will automatically identify who is speaking at any given time, vastly improving the readability of transcripts and enabling speaker-specific highlights for podcasts with multiple hosts or guests.

### 💡 Problem Statement
**Current situation:**
The application uses Groq's Whisper API for transcription, which provides fast and accurate text but does not support speaker diarization natively. Transcripts from multi-speaker podcasts are rendered as a single block of text or split by pauses, without indicating who is speaking.

**User impact:**
- **Readability:** Users struggle to follow conversations with multiple participants.
- **Highlight Quality:** Highlights may cut across speakers awkwardly or fail to attribute quotes to the correct person.
- **Manual Effort:** Users have to manually identify and label speakers if they export the transcript.

**Example scenario:**
An interview podcast has a host and a guest. The transcript shows "Welcome back to the show thanks for having me". Without diarization, the user cannot easily split this into Host and Guest lines or generate a highlight focusing only on the guest's answers.

### 🚀 Proposed Solution
**What:**
Integrate an external API (like Deepgram or AssemblyAI) that natively supports transcription with speaker diarization, or run a secondary lightweight diarization model (like pyannote.audio) to align with existing Whisper transcripts.

**How it works:**
1.  **Audio Processing:** The user uploads an audio file.
2.  **API Call:** The server sends the audio to the Deepgram API with the `diarize=true` parameter.
3.  **Result Processing:** The API returns word-level timestamps along with a `speaker` ID (e.g., Speaker 0, Speaker 1).
4.  **UI Integration:** The `TranscriptViewer` component is updated to group segments by speaker and display speaker labels (which the user can rename).

**Why this approach:**
Using an API like Deepgram is significantly easier and more performant than trying to run a heavy diarization model (like Pyannote) locally or on Vercel. It provides high accuracy and speed, replacing or supplementing the current Groq Whisper implementation.

### 📊 Research Findings

**Technology Analysis:**
- **Tool:** Deepgram API / AssemblyAI
- **Maturity:** Highly stable, industry standards for speech-to-text.
- **Performance:** Deepgram is known for being extremely fast (comparable to Groq Whisper) while supporting diarization.
- **Cost:** Deepgram is ~$0.0043/min, AssemblyAI is ~$0.012/min. (Groq Whisper is currently ~$0.0005/min, so there is a cost increase).

**Competitive Analysis:**
- **Descript:** Has excellent native speaker detection and allows renaming speakers.
- **Otter.ai:** Built around speaker diarization.
- **Our App:** Currently lacks speaker identification, making it less suitable for interviews.

**Best Practices:**
- Allow users to rename generic labels ("Speaker 1") to actual names ("John Doe").
- Group continuous words from the same speaker into readable paragraphs.

### 🧪 Proof of Concept

**Implementation:**
A POC script `research/pocs/speaker-diarization-poc.ts` was created to demonstrate how diarized API responses (grouped by words with speaker IDs) can be parsed into speaker-separated segments.

```typescript
// research/pocs/speaker-diarization-poc.ts (excerpt)
// Mocking Deepgram API call for Speaker Diarization
const response = await fetch('https://api.deepgram.com/v1/listen?diarize=true', { ... });
const data = await response.json();

// Parse words into speaker segments
let currentSpeaker = words[0].speaker;
// ... group words by speaker ...
console.log(`Speaker ${currentSpeaker}: ${transcript}`);
```

**Results:**
- Correctly parses word-level speaker IDs into continuous dialogue blocks.
- Demonstrates the data structure needed for the frontend.

### 📈 Value Proposition

**Benefits:**
- ✅ **Improved UX:** Transcripts are much easier to read and edit.
- ✅ **Better Highlights:** GPT can use speaker information to make better decisions about where to cut highlights (e.g., full Q&A exchanges).
- ✅ **Professional Export:** SRT and text exports become more valuable with speaker labels.

**User stories:**
- As a **Podcast Editor**, I want to see who is speaking in the transcript so I can easily find the guest's best quotes.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massively improves transcript quality for multi-speaker audio.
- ✅ Necessary feature to compete with professional tools like Descript.

**Cons:**
- ❌ **Cost:** Moving away from Groq Whisper to Deepgram/AssemblyAI will increase transcription costs per minute.
- ❌ **Complexity:** Handling speaker label state (renaming, merging speakers) adds frontend complexity.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Pyannote.audio** | Free (open source) | Requires heavy GPU server (Python), hard to integrate in Next.js | Rejected due to infrastructure complexity |
| **AssemblyAI** | Great accuracy | Slower and more expensive than Deepgram | Backup option if Deepgram fails |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Sign up for Deepgram API and get credentials.
- [ ] Create `/api/transcribe-deepgram` endpoint supporting diarization.
- [ ] Update `TranscriptionSegment` type to include `speakerId`.

**Phase 2: Core Feature** (estimated: 3 days)
- [ ] Update `TranscriptViewer` to display speaker avatars/labels next to segments.
- [ ] Implement UI for users to rename "Speaker 0" to "Alice".
- [ ] Group adjacent segments from the same speaker.

**Phase 3: Polish & Export** (estimated: 2 days)
- [ ] Include speaker names in GPT highlight generation prompt.
- [ ] Update export functions (TXT, SRT, MD) to include speaker names.

**Total estimated effort:** 7 developer-days

**Dependencies:**
- `@deepgram/sdk` (optional, can use REST)

**Risks:**
- ⚠️ **Diarization Accuracy:** Sometimes models confuse speakers or split one speaker into two. *Mitigation: Allow users to merge segments or reassign speakers.*

### 📚 Resources

**Documentation:**
- [Deepgram Diarization Docs](https://developers.deepgram.com/docs/diarization)
- [AssemblyAI Speaker Diarization](https://www.assemblyai.com/docs/models/speaker-diarization)

### 🎬 Next Steps

**If approved:**
1.  Run a cost-benefit analysis on Deepgram vs Groq Whisper.
2.  Implement a backend test script with real Deepgram API to measure accuracy on our specific audio types.
