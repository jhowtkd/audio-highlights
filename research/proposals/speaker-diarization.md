## 🔬 Researcher: Automated Speaker Diarization

### 🎯 Executive Summary
I propose integrating **Automated Speaker Diarization** into the existing transcription workflow. This will automatically identify and label different speakers (e.g., "Speaker 1", "Speaker 2") throughout the transcript, greatly enhancing readability, searchability, and the quality of generated highlights for multi-speaker content like interviews and podcasts.

### 💡 Problem Statement
**Current situation:**
The current `api/transcribe` endpoint uses Groq's Whisper API, which provides excellent transcription and timestamps but lacks native speaker diarization. All speech is presented as a single continuous block without speaker context.

**User impact:**
For interviews or panel discussions, users cannot easily distinguish who is talking. If they search for a specific person's point, or if a highlight requires context of *who* said *what*, they have to manually listen and label the speakers.

**Example scenario:**
A user transcribes a 1-hour interview. The resulting transcript has 100 segments. To create a highlight of the guest's best quotes, the user must read through the text and guess which segments belong to the guest versus the host, making the text-based editing experience frustrating and slow.

### 🚀 Proposed Solution
**What:**
Enhance the transcription pipeline to perform speaker diarization using a complementary API or model, mapping speaker labels to the existing `TranscriptionSegment` structures.

**How it works:**
1.  **Transcription:** Proceed with the fast Groq Whisper transcription as usual.
2.  **Diarization:** Concurrently or sequentially, send the audio to a specialized Diarization API (like Deepgram or Pyannote via Replicate) or leverage an upcoming Groq diarization feature if available.
3.  **Alignment:** Merge the speaker segments with the Whisper text segments based on timestamps.
4.  **UI Update:** Update the `TranscriptViewer` and `TranscriptSegment` components to display speaker labels and allow users to rename them (e.g., changing "Speaker 1" to "John Doe").

**Why this approach:**
-   Maintains the ultra-fast transcription speed of Groq.
-   Provides critical context for podcast/interview editors.
-   Enhances the LLM's ability to generate better highlights (by giving the GPT-4o model context of speaker turns).

### 📊 Research Findings

**Technology Analysis:**
-   **Deepgram:** Provides extremely fast and accurate diarization. Can replace Groq Whisper or be used alongside it.
-   **Pyannote.audio:** Open-source standard, but requires a GPU backend (could be added to `ffmpeg-service` if GPU is available, but likely too heavy for our current Railway setup).
-   **AssemblyAI:** Excellent out-of-the-box diarization support.

**Competitive Analysis:**
-   **Descript:** Features automatic speaker detection and voice profiling.
-   **Otter.ai:** Built entirely around speaker identification.
-   **Our App:** Currently assumes single-speaker or relies on manual context.

**Best Practices:**
-   Always allow users to override or rename speaker labels, as models are rarely 100% accurate.

### 🧪 Proof of Concept

**Implementation:**
Since adding a heavy GPU model to the backend is complex, the POC explores using Deepgram's API for the diarization pass.

```typescript
// POC snippet for merging diarization with Whisper outputs
function alignSpeakersToSegments(
  whisperSegments: TranscriptionSegment[],
  diarizationData: DiarizationSegment[]
): TranscriptionSegment[] {
  return whisperSegments.map(seg => {
    // Find the speaker that overlaps the most with this segment's timestamps
    const dominantSpeaker = diarizationData.find(d =>
      Math.max(0, Math.min(seg.end, d.end) - Math.max(seg.start, d.start)) > 0.5 * (seg.end - seg.start)
    );

    return {
      ...seg,
      speaker: dominantSpeaker ? dominantSpeaker.speaker : 'Unknown'
    };
  });
}
```

### 📈 Value Proposition

**Benefits:**
-   ✅ **Contextual Clarity:** Makes reading the transcript infinitely easier.
-   ✅ **Smarter Highlights:** Allows the Highlight generator to understand dialogue, Q&A formats, and reactions.
-   ✅ **Professional Output:** Enables exporting SRT/VTT with speaker labels.

**User stories:**
-   As a podcast editor, I want to see exactly when the guest is speaking so I can quickly cut out the host's long questions.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Massive leap in feature parity with professional tools like Descript.
-   ✅ Improves downstream AI tasks (highlights).

**Cons:**
-   ❌ **Cost/Complexity:** Requires adding another API provider (Deepgram/AssemblyAI) or deploying a heavy model like Pyannote.
-   ❌ **Latency:** Diarization is computationally heavy and might increase the total "Processing" time.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Deepgram** | Fast, accurate, simple API. | Adds another dependency/cost. | **Recommended** |
| **Pyannote (Self-hosted)** | Free, open-source. | High infrastructure cost (GPU). | Rejected for now. |

### 🛠️ Implementation Plan

**Phase 1: API Evaluation** (estimated: 2 days)
-   [ ] Evaluate Deepgram vs AssemblyAI for cost, speed, and accuracy on our test audio files.
-   [ ] Finalize API selection and add credentials.

**Phase 2: Backend Integration** (estimated: 3 days)
-   [ ] Update `api/transcribe/route.ts` to include the diarization call.
-   [ ] Implement the timestamp alignment logic.
-   [ ] Update `TranscriptionSegment` type to include `speaker?: string`.

**Phase 3: Frontend Polish** (estimated: 2 days)
-   [ ] Update `TranscriptSegment` component to display speaker avatars/labels.
-   [ ] Add UI functionality to rename speakers globally (e.g., "Speaker 1" -> "Alice").

**Total estimated effort:** 7 developer-days

**Dependencies:**
-   New API Key for Diarization service (e.g., Deepgram).

**Risks:**
-   ⚠️ **Alignment issues:** Whisper and Diarization models might segment audio slightly differently. Mitigation: robust overlap calculation logic.

### 📚 Resources

**Documentation:**
-   [Deepgram Diarization Docs](https://developers.deepgram.com/docs/diarization)
-   [Pyannote Audio](https://github.com/pyannote/pyannote-audio)

### 🎬 Next Steps

**If approved:**
1.  Run a small test batch using Deepgram and AssemblyAI to compare results.
2.  Update the data models (`src/types/index.ts`) to support speaker data.
