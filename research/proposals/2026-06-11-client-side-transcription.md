## 🔬 Researcher: Client-Side Audio Transcription

### 🎯 Executive Summary
Propose replacing the Groq Whisper API dependency with an in-browser WebAssembly-based local model for audio transcription. This approach will significantly reduce API costs, eliminate network latency for file uploads, and dramatically improve user privacy since audio data never leaves the client's device.

### 💡 Problem Statement
**Current situation:**
- The application currently uploads potentially large audio/video files (up to 500MB) to the server.
- The server then uses the Groq API (Whisper) to transcribe the audio.
- This process consumes bandwidth, requires server-side chunking logic for large files, incurs API costs per minute of audio, and raises privacy concerns for sensitive recordings.

**User impact:**
- Users on slow connections face long wait times for uploads before transcription even begins.
- Users cannot use the application offline.
- Users with sensitive, confidential recordings may be hesitant to upload them to a third-party server.

**Example scenario:**
- A user wants to transcribe a 2-hour confidential board meeting. They must upload a 200MB file over a slow hotel Wi-Fi connection, wait for processing, and trust that their data is secure on Groq's servers.

### 🚀 Proposed Solution
**What:**
Integrate `transformers.js` to run a quantized Whisper model (e.g., `Xenova/whisper-tiny` or `whisper-base`) entirely within the user's browser using WebAssembly.

**How it works:**
- When a user selects a file, the application loads the Whisper model into a Web Worker (to avoid blocking the main UI thread).
- The audio is decoded locally using the browser's Web Audio API.
- The transcription is performed locally, segment by segment.
- The resulting transcript is saved to IndexedDB (which we already use).

**Why this approach:**
- **Zero API Costs:** Transcription runs on the user's hardware.
- **Privacy First:** Data never leaves the browser.
- **Offline Capability:** Once the model is cached, the app works without an internet connection.
- **Instant Start:** Transcription can begin immediately upon file selection, without waiting for an upload.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Hugging Face `transformers.js`
- **Maturity:** Stable (v2/v3). WebGPU support is in active development for massive performance gains.
- **Performance:** A quantized `tiny` model is ~40MB and runs in near real-time on modern hardware.
- **Ecosystem:** Excellent integration with React via Web Workers.

**Competitive Analysis:**
- **MacWhisper:** A popular native app that relies entirely on local processing.
- **TurboScribe:** Uses server-side processing but offers a premium for privacy.
- **Our App:** Currently relies 100% on cloud processing.

### 🧪 Proof of Concept

**Implementation:**
```javascript
// Example of how to use transformers.js in a Web Worker
import { pipeline, env } from '@xenova/transformers';

// Disable local file checks
env.allowLocalModels = false;

let transcriber = null;

async function loadModel() {
  if (!transcriber) {
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
  }
}

self.onmessage = async (e) => {
  const { audioData } = e.data;
  await loadModel();

  const result = await transcriber(audioData, {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: true,
  });

  self.postMessage({ type: 'done', result });
};
```

**Performance:**
- **Upload Time:** 0s (compared to potentially minutes).
- **Processing Time:** Slightly slower than Groq (depends on user hardware), but feels faster because it starts immediately.
- **Network Usage:** Only the initial model download (~40MB, cached), then 0 bytes per file.

### 📈 Value Proposition

**Benefits:**
- ✅ **Cost Reduction:** $0 per minute of transcription.
- ✅ **Enhanced Privacy:** Perfect for sensitive legal, medical, or corporate recordings.
- ✅ **Offline Support:** Resilient to network issues.

**User stories:**
- As a **Journalist**, I can **transcribe sensitive interviews completely offline** so that **my sources remain secure.**

### ⚖️ Trade-offs

**Pros:**
- ✅ Unmatched privacy.
- ✅ Zero ongoing API costs.
- ✅ Works offline.

**Cons:**
- ❌ Initial load time is slower as the model must be downloaded (though it is cached).
- ❌ Transcription speed and accuracy depend entirely on the user's hardware.
- ❌ The `tiny` or `base` models are less accurate than the `large-v3` model currently used via Groq.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Keep Groq API | Highest accuracy, very fast | Ongoing costs, privacy concerns | Retain as an option, but not the only one |
| OpenAI API | High accuracy | Slower than Groq, higher costs | Not chosen |

### 🛠️ Implementation Plan

**Phase 1: Research & Prototype** (estimated: 2 days)
- [ ] Create a dedicated Web Worker for `transformers.js`.
- [ ] Implement audio decoding using `AudioContext` in the browser.

**Phase 2: Integration** (estimated: 3 days)
- [ ] Add a UI toggle to let users choose between "Fast & Accurate (Cloud)" and "Private (Local)" transcription.
- [ ] Handle model downloading progress states in the UI.

**Total estimated effort:** 5 developer-days

**Risks:**
- ⚠️ **Browser Memory Limits:** Mobile browsers might crash if the model is too large.
  - *Mitigation:* Restrict local transcription to desktop browsers or use the smallest possible model on mobile.
- ⚠️ **Accuracy:** Users might complain about lower accuracy compared to Groq.
  - *Mitigation:* Clearly label the local option and set expectations. Allow fallback to cloud.

### 📚 Resources

**Documentation:**
- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js/index)

### 🎬 Next Steps

**If approved:**
1.  Implement the Web Worker POC and measure performance across different devices.
2.  Design the UI for the transcription mode selector.
