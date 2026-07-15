## 🔬 Researcher: Speaker Diarization Integration

### 🎯 Executive Summary
This proposal recommends implementing Speaker Diarization (speaker identification) to distinguish between multiple speakers in transcripts. This will significantly improve readability for interviews, podcasts, and panel discussions by automatically labeling who is talking and grouping their speech segments.

### 💡 Problem Statement
**Current situation:**
The application uses Groq's Whisper API, which provides excellent word-level timestamps but does not identify who is speaking. The resulting transcript is a flat sequence of text.

**User impact:**
- For multi-speaker audio (like interviews), users cannot easily tell when a new speaker begins talking.
- Generating highlights based on specific speakers (e.g., "Give me highlights only from the guest") is impossible.

**Example scenario:**
A user uploads an interview between a host and a guest. The transcript lumps their conversation together. If they want to highlight only the guest's answers, they must manually locate those segments in the flat text.

### 🚀 Proposed Solution
**What:**
Add a speaker diarization step to the transcription pipeline, appending a `speaker` field (e.g., "Speaker A", "Speaker B") to the `TranscriptionSegment` data model.

**How it works:**
Since Groq Whisper does not natively support diarization, we have two primary options:
1.  **Dual API Approach:** Run transcription through Groq Whisper (for speed/cost) and run a separate lightweight model (like Pyannote on a custom service) strictly for speaker intervals. Merge the timestamps in `src/lib/transcription-utils.ts`.
2.  **Unified API Approach:** Switch from Groq Whisper to an API that supports native diarization in a single pass (e.g., Deepgram or AssemblyAI).

**Why this approach:**
Speaker identification is a table-stakes feature for professional podcast/interview transcription tools. It unlocks new features like speaker-specific highlight generation.

### 📊 Research Findings

**Technology Analysis:**
- **Option 1: Deepgram API**
  - **Maturity:** Production ready.
  - **Performance:** Very fast, single-pass transcription + diarization.
  - **Cost:** ~$0.0043/min.
- **Option 2: Pyannote.audio (Self-hosted)**
  - **Maturity:** Stable, state-of-the-art open-source diarization.
  - **Dependencies:** Requires a GPU-backed Python microservice (could be added to Railway).
  - **License:** MIT.
- **Option 3: AssemblyAI**
  - **Maturity:** Production ready, highly accurate.
  - **Cost:** ~$0.006/min.

**Competitive Analysis:**
- **Otter.ai:** Natively supports and prompts for speaker identification.
- **Descript:** Assigns speakers to text blocks automatically.
- **Riverside:** Includes speaker separation for local recordings.
- **Our App:** Currently lacks speaker separation.

### 🧪 Proof of Concept

**Implementation:**
A POC script `research/pocs/speaker-diarization-poc.ts` was created to demonstrate how to merge raw word timestamps (from Groq) with speaker intervals (from a potential Diarization service).

```typescript
// research/pocs/speaker-diarization-poc.ts
function alignSpeakers(words: Word[], intervals: SpeakerInterval[]): DiarizedWord[] {
  return words.map(word => {
    // Find the interval that overlaps most with this word
    let bestInterval = intervals[0];
    let maxOverlap = 0;
    // ... overlap calculation logic ...
    return { ...word, speaker: maxOverlap > 0 ? bestInterval.speaker : 'Speaker_UNKNOWN' };
  });
}
```

**Results:**
The logic successfully takes overlapping time boundaries and correctly assigns words to "Speaker_A" or "Speaker_B".

### 📈 Value Proposition

**Benefits:**
- ✅ **Enhanced Readability:** Transcripts become script-like, making them vastly easier to read.
- ✅ **Smart Filtering:** GPT-5 can be prompted to ignore the "host" and only summarize the "guest".
- ✅ **Professional Appeal:** Matches feature parity with industry leaders.

**User stories:**
- As a **Podcast Editor**, I can see who is speaking so that I can easily find and extract quotes from my guest.

### ⚖️ Trade-offs

**Pros:**
- ✅ Major UX improvement for multi-speaker content.
- ✅ Unlocks new AI analysis capabilities (e.g., talk-time ratio analysis).

**Cons:**
- ❌ **Cost/Complexity:** Adding a new API (Deepgram) increases cost, while self-hosting Pyannote increases infrastructure complexity.
- ❌ **Migration:** Existing transcripts will lack speaker data unless re-processed.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Groq Whisper | Fast, currently used | No diarization support | Not viable for this feature |
| Deepgram API | Fast, all-in-one | Vendor lock-in, new cost | **Recommended** |
| Pyannote (Railway) | No per-minute cost | High maintenance, slow on CPU | Secondary option |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Update `src/types/index.ts` to include `speaker?: string` on `TranscriptionSegment` and `WordTimestamp`.
- [ ] Evaluate and select the final diarization provider (Deepgram vs Pyannote).

**Phase 2: Core Feature** (estimated: 3 days)
- [ ] Implement the integration in `src/app/api/transcribe/route.ts`.
- [ ] Implement the timestamp alignment logic if using a separate service.

**Phase 3: Polish & UI** (estimated: 2 days)
- [ ] Update the frontend component that displays the transcript (`TranscriptViewer`) to display speaker labels with distinct colors/avatars.
- [ ] Allow users to rename "Speaker A" to actual names (e.g., "John Doe").

**Total estimated effort:** 7 developer-days

**Dependencies:**
- Deepgram SDK (if chosen) or custom Pyannote microservice.

### 📚 Resources

**Documentation:**
- [Deepgram Diarization Docs](https://developers.deepgram.com/docs/diarization)
- [Pyannote.audio GitHub](https://github.com/pyannote/pyannote-audio)

### 🎬 Next Steps

**If approved:**
1. Secure API keys for Deepgram/AssemblyAI to test accuracy against Pyannote.
2. Update the frontend UI types to safely handle `speaker` fields.

### 💬 Discussion Points
- Are we willing to switch from Groq Whisper to a paid API like Deepgram to get this feature out of the box?
- Should we charge users for "premium" diarization?
