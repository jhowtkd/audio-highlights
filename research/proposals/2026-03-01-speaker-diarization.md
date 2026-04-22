## 🔬 Researcher: Speaker Diarization Integration

### 🎯 Executive Summary
Propose integrating speaker diarization to automatically identify and label different speakers ("who spoke when") in the generated transcripts. This significantly enhances the readability and utility of multi-speaker podcasts and interviews.

### 💡 Problem Statement
**Current situation:**
The current transcription via Groq Whisper provides accurate text and timestamps but lacks speaker identification. All text appears as a single continuous block from an unknown speaker.

**User impact:**
Users processing interviews, panels, or co-hosted podcasts must manually identify and label speakers in the generated text, which is tedious and error-prone. This limits the value of the export for content creators.

**Example scenario:**
A user uploads a 1-hour interview between a host and a guest. The resulting Markdown export has no speaker labels, making it difficult to read as a dialogue or use for article generation without watching the video simultaneously.

### 🚀 Proposed Solution
**What:**
Enhance the transcription pipeline to include Speaker Diarization, labelling each segment with a generic identifier (e.g., "Speaker A", "Speaker B", etc.) or allowing users to assign names to these identifiers.

**How it works:**
Since Groq's current Whisper API does not natively support diarization, we propose running a parallel or sequential process using an external diarization model (like `pyannote/speaker-diarization-3.1` via Hugging Face or Replicate) or switching the transcription provider for multi-speaker files (e.g., Deepgram or AssemblyAI which have native diarization). The resulting speaker segments are then aligned with the Whisper transcript segments.

**Why this approach:**
Provides immediate value for interview/podcast formats. Using a dedicated model or provider for diarization ensures high accuracy. Aligning timestamps allows us to keep Groq Whisper for fast transcription while adding speaker labels.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `pyannote/speaker-diarization-3.1` (via Replicate/Hugging Face) OR Deepgram API.
- **Maturity:** Stable (Industry standard for open-source diarization).
- **Adoption:** Widely used in podcasting and meeting summarization tools.
- **Community:** Active development, high GitHub stars.
- **License:** MIT / Commercial API depending on route.

**Competitive Analysis:**
- Descript: Excellent native speaker identification and voice profiling.
- Riverside: Automatic speaker separation in transcripts.
- Otter.ai: Real-time speaker identification.
- Our App: Currently lacks any speaker separation.

**Best Practices:**
- Allow users to rename "Speaker A" to actual names post-transcription.
- Visually separate different speakers in the TranscriptViewer with distinct colors or avatars.
- Ensure exports (SRT/Markdown) include speaker tags.

### 🧪 Proof of Concept

**Implementation:**
```javascript
// A simple Node.js POC demonstrating API call to Replicate for pyannote
import Replicate from "replicate";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

async function runDiarization(audioUrl) {
  const output = await replicate.run(
    "pyannote/speaker-diarization-3.1:...",
    { input: { audio: audioUrl, num_speakers: 2 } }
  );
  console.log("Diarization output:", output);
  // Returns: [{ start: 0.0, end: 5.2, speaker: "SPEAKER_00" }, ...]
}
```

**Demo:**
N/A (API-based POC)

**Performance:**
- Before: Manual labeling (minutes to hours).
- After: Automated labeling (seconds to minutes, depending on API).
- Impact: Huge usability improvement for multi-speaker content.

### 📈 Value Proposition

**Benefits:**
- ✅ Improved Readability: Transcripts look like actual conversations.
- ✅ Better Highlights: GPT-4o can use speaker labels to generate better context for highlights (e.g., "Guest explains X").
- ✅ Time Saving: Eliminates manual transcription formatting.

**User stories:**
- As a podcaster, I can see who is speaking in the transcript so that I can easily extract quotes from my guest.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massive UX improvement for interviews.
- ✅ Enables more intelligent AI highlight generation.

**Cons:**
- ❌ Adds cost and complexity (requires a second API call or switching from free Groq Whisper to a paid provider).
- ❌ Timestamp alignment between Whisper and Diarization models can be tricky.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Deepgram API | Fast, built-in diarization | Costs money, replaces Groq | Strong contender for multi-speaker mode |
| Pyannote via HF | Open source | Slower, requires alignment | Good for keeping Groq |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 3 days)
- [ ] Evaluate and select diarization provider (Deepgram vs Replicate/Pyannote).
- [ ] Update `TranscriptionSegment` type to include optional `speaker` field.

**Phase 2: Core Feature** (estimated: 4 days)
- [ ] Implement backend logic to fetch diarization data and align with transcript segments.
- [ ] Update `TranscriptViewer` UI to display speaker labels and allow renaming.

**Phase 3: Polish & Testing** (estimated: 2 days)
- [ ] Update export utilities (Markdown, SRT) to include speaker names.
- [ ] E2E testing on multi-speaker audio.

**Total estimated effort:** 9 developer-days

**Dependencies:**
- Replicate API key or Deepgram API key.

**Risks:**
- ⚠️ Misalignment: Diarization segments might not perfectly align with Whisper word timestamps.
  - Mitigation: Use overlap algorithms to assign the most likely speaker to each word.

### 📚 Resources

**Documentation:**
- [Pyannote Audio](https://github.com/pyannote/pyannote-audio)
- [Deepgram Diarization Docs](https://developers.deepgram.com/docs/diarization)

### 🎬 Next Steps

**If approved:**
1. Decide on the API provider (Deepgram vs Replicate).
2. Create an isolated script to test timestamp alignment between Groq Whisper and the chosen diarization output.

### 💬 Discussion Points
- Should we switch entirely to Deepgram for transcription, or keep Groq and just add Pyannote for diarization?
