## 🔬 Researcher: Speaker Diarization

### 🎯 Executive Summary
I propose adding **Speaker Diarization** (speaker identification) to the transcription pipeline. This feature will automatically identify different speakers in an audio file (e.g., "Speaker 1", "Speaker 2") and label the transcript segments accordingly, providing much-needed context for interviews and multi-host podcasts.

### 💡 Problem Statement
**Current situation:**
The current transcription pipeline uses Groq Whisper, which transcribes text accurately but does not identify *who* is speaking. The resulting transcript is a monolithic block of text broken only by timestamps.

**User impact:**
For interviews, panels, or multi-host podcasts, users cannot easily distinguish between questions and answers or track the flow of conversation. When exporting the transcript or generating highlights, the lack of speaker labels makes the text confusing to read.

**Example scenario:**
A journalist uploads a 30-minute interview. The transcript currently shows:
"[0:00] What do you think about the new product?"
"[0:05] I think it's fantastic."
With Diarization, it would show:
"[0:00] **Speaker 1:** What do you think about the new product?"
"[0:05] **Speaker 2:** I think it's fantastic."

### 🚀 Proposed Solution
**What:**
Enhance the `/api/transcribe` endpoint to support speaker diarization. Since basic Whisper doesn't support diarization natively, we will use a dedicated diarization model (like Pyannote.audio) or a specialized API endpoint (e.g., AssemblyAI, Deepgram, or a Groq-compatible solution if they introduce it, or a lightweight client-side clustering approach on the embeddings).

**How it works:**
1.  **Audio Processing:** The audio is sent to a service that supports diarization (e.g., Deepgram API or a self-hosted Pyannote microservice similar to `ffmpeg-service`).
2.  **Transcript Merging:** The diarization timeline is merged with the Whisper word-level timestamps to assign a `speakerId` to each `TranscriptionSegment` and `WordTimestamp`.
3.  **UI Update:** The `TranscriptViewer` is updated to display speaker avatars/labels and group continuous segments by the same speaker. Users can rename "Speaker 1" to "Interviewer", etc.

**Why this approach:**
- **Essential Feature:** Diarization is a table-stakes feature for any modern transcription tool dealing with podcasts/interviews.
- **Improved UX:** Makes the transcript readable and editable.
- **Better Highlights:** GPT-4o can generate better highlights if it knows who is speaking (e.g., "Find the part where the guest answers the question about pricing").

### 📊 Research Findings

**Technology Analysis:**
- **Option 1: Third-Party API (Deepgram/AssemblyAI)**
  - *Maturity:* High.
  - *Accuracy:* Excellent.
  - *Trade-off:* Adds another API dependency and cost.
- **Option 2: Self-hosted Microservice (Pyannote.audio)**
  - *Maturity:* Industry standard open-source.
  - *Accuracy:* Very good.
  - *Trade-off:* Requires GPU for fast processing; adds backend complexity.
- **Option 3: WhisperX**
  - *Maturity:* High. Combines Whisper with Pyannote.
  - *Trade-off:* We would need to replace the Groq API with a self-hosted or Replicate-hosted WhisperX instance.

**Competitive Analysis:**
- **Descript:** Has excellent built-in speaker detection and allows renaming speakers.
- **Otter.ai:** Built its reputation on real-time speaker diarization.
- **Our App:** Currently lacks speaker identification entirely.

### 🧪 Proof of Concept

**Implementation Strategy (using an external API like Deepgram for POC):**
```typescript
// Example payload structure we want to achieve
interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker?: string; // NEW FIELD
  words: WordTimestamp[];
}

// In TranscriptViewer.tsx
<div className="flex flex-col gap-2">
  {segments.map((segment, index) => {
    const isNewSpeaker = index === 0 || segment.speaker !== segments[index - 1].speaker;
    return (
      <div key={segment.id} className="mb-4">
        {isNewSpeaker && (
          <div className="font-bold text-sm text-slate-500 mb-1">
            {segment.speaker || 'Unknown Speaker'}
          </div>
        )}
        <p>{segment.text}</p>
      </div>
    );
  })}
</div>
```

### 📈 Value Proposition

**Benefits:**
- ✅ **Readability:** Transcripts become actual conversational scripts.
- ✅ **Accuracy:** AI highlight generation gains context, improving the quality of the selected clips.
- ✅ **Export Value:** Exported SRT/VTT/Markdown files are much more useful for users.

**User stories:**
- As a podcast editor, I want to see who is speaking so I can quickly cut out the interviewer's "mhm"s and "yeah"s while the guest is talking.
- As a journalist, I want the exported text to automatically attribute quotes to the correct speaker.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massively improves the core product offering.
- ✅ High user demand for interview-style content.

**Cons:**
- ❌ **Cost/Complexity:** Requires either paying for a new API (Deepgram) or hosting a heavy ML model (Pyannote).
- ❌ **Latency:** Diarization adds processing time to the initial upload/transcribe phase.

### 🛠️ Implementation Plan

**Phase 1: Research & Decision** (estimated: 2 days)
- [ ] Evaluate cost vs. accuracy of Deepgram vs. Replicate (WhisperX).
- [ ] Choose the backend implementation path.

**Phase 2: Backend Integration** (estimated: 3 days)
- [ ] Implement the chosen diarization service in `src/app/api/transcribe/route.ts`.
- [ ] Update `TranscriptionSegment` type to include `speaker`.

**Phase 3: Frontend UI** (estimated: 2 days)
- [ ] Update `TranscriptViewer` to render speaker labels.
- [ ] Add UI to allow users to rename speakers (e.g., "Speaker 1" -> "John").

**Total estimated effort:** 7 developer-days

**Dependencies:**
- To be decided (Deepgram SDK or Replicate SDK).

### 🎬 Next Steps

**If approved:**
1.  Run a small accuracy test comparing Deepgram's diarization with a self-hosted Pyannote model.
2.  Finalize the architecture decision.
