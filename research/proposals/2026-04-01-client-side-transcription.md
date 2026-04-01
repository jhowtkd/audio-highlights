## 🔬 Researcher: Client-Side Audio Transcription

### 🎯 Executive Summary
Replace the current server-side Groq Whisper transcription with a **client-side solution using Transformers.js**. This enables robust, zero-cost, and private transcription directly in the user's browser, eliminating external API dependencies and reducing potential server overload.

### 💡 Problem Statement
**Current situation:**
The application relies on `api/transcribe` which sends audio files to the Groq Whisper API for transcription. While fast, this relies on a third-party service and requires network transmission of large audio files.

**User impact:**
- **Cost & Rate Limits:** Dependent on Groq API limits. High usage could lead to rate limiting (429 errors) or increased costs.
- **Privacy:** Users must upload their potentially sensitive audio files to an external server.
- **Network Dependency:** Uploading large audio files (up to 500MB) can be slow and unreliable on poor connections.
- **Server Load:** The Next.js server acts as a proxy, handling large file uploads and holding connections open during transcription.

**Example scenario:**
A journalist needs to transcribe a sensitive interview but is on a slow internet connection. Uploading the 200MB file takes 10 minutes, and they are concerned about the data leaving their device.

### 🚀 Proposed Solution
**What:**
Implement client-side transcription using [`@xenova/transformers`](https://github.com/xenova/transformers.js) and a lightweight Whisper model (e.g., `Xenova/whisper-tiny` or similar optimized WebAssembly models).

**How it works:**
1. The browser downloads the Whisper model once and caches it locally (Cache API).
2. Audio files are processed entirely in the browser using WebAssembly.
3. A Web Worker handles the heavy transcription inference to prevent blocking the main UI thread.
4. Timestamps and segments are generated locally, mimicking the current API output format.

**Why this approach:**
- **Zero API Costs:** No third-party API keys or usage fees required for transcription.
- **Absolute Privacy:** Audio files never leave the user's device.
- **Offline Capable:** Once the model is cached, transcription can happen without an internet connection.
- **Reduced Server Load:** The server no longer needs to process or proxy large audio files for transcription.

### 📊 Research Findings

**Technology Analysis:**
- **Library:** `@xenova/transformers` (Transformers.js)
- **Maturity:** Stable, widely adopted for in-browser AI.
- **Model:** `Xenova/whisper-tiny` (approx. 40-75MB depending on quantization) or similar.
- **Performance:** Leverages WebAssembly (WASM) and potentially WebGPU for hardware acceleration where available.

**Competitive Analysis:**
- Many modern "AI-first" tools are shifting towards local-first architecture to reduce latency and costs, especially for privacy-sensitive tasks. Tools like Whisper.cpp have proven the viability of local, low-resource transcription.

**Best Practices:**
- Must use Web Workers to avoid freezing the browser tab during transcription.
- Implement progressive loading and caching for the model weights.
- Provide clear UI feedback (progress bars) during both model downloading and transcription phases.

### 🧪 Proof of Concept

**Implementation:**
A successful prototype (`research/pocs/whisper_poc.js`) demonstrated the ability to load a Whisper model (`Xenova/whisper-tiny`), process raw audio data (converted to 16kHz float32 arrays), and generate transcriptions successfully within a Node.js environment (which accurately simulates the WebAssembly/Transformers.js capabilities available in the browser).

```javascript
// Excerpt from POC
const { pipeline } = require('@xenova/transformers');

// Load the pipeline
const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');

// Process audio (must be 16kHz float32)
// ... audio processing logic ...
const output = await transcriber(float32Audio);
console.log('Transcription result:', output);
```

**Performance Metrics:**
- POC confirmed successful model loading and transcription execution. While inference time will vary heavily based on the user's hardware (CPU/WebGPU), the tiny models are generally fast enough for practical use, especially when privacy and offline capabilities are paramount.

### 📈 Value Proposition

**Benefits:**
- ✅ **Cost Savings:** Eliminates Groq API costs and dependency.
- ✅ **Enhanced Privacy:** Perfect for sensitive content.
- ✅ **Reliability:** No network failures during large uploads.
- ✅ **Scalability:** Server doesn't scale linearly with transcription requests.

**User stories:**
- As a user with sensitive data, I can transcribe my audio locally without worrying about data leaks.
- As a user with slow internet, I don't have to wait for a 500MB file to upload before transcription begins.

### ⚖️ Trade-offs

**Pros:**
- ✅ Free, Private, Offline-capable.

**Cons:**
- ❌ **Initial Download:** Users must download the model weights (40MB+) on first use.
- ❌ **Client Hardware Dependency:** Transcription speed is dictated by the user's device. Slower on old laptops/phones.
- ❌ **Accuracy/Speed Trade-off:** Smaller models (`tiny`, `base`) run faster in-browser but may have higher Word Error Rates compared to the server-side `whisper-large-v3`.
- ❌ **Memory Usage:** Browser tab memory usage will spike during transcription.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Keep Groq API | Fast, highly accurate, works on any device | Costs money, requires internet, privacy concerns | Not chosen as primary, but could remain as a fallback option |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Add `@xenova/transformers` to dependencies (or configure as dynamic import).
- [ ] Implement Web Worker architecture (`src/lib/transcription-worker.ts`) to handle model loading and inference.
- [ ] Implement audio decoding/resampling to 16kHz Float32Array in the browser (using Web Audio API).

**Phase 2: Core Feature** (estimated: 3 days)
- [ ] Integrate the worker with the UI (`Dropzone` or a new component).
- [ ] Implement UI for "Downloading Model" and "Transcribing" progress states.
- [ ] Map the local transcription output format to the existing `TranscriptionSegment` interface used by the application.

**Phase 3: Polish & Testing** (estimated: 2 days)
- [ ] Test on various browsers (Chrome, Safari, Firefox).
- [ ] Implement fallback to server-side Groq API if the browser doesn't support necessary features or if the device is too slow.
- [ ] Add caching strategy for the model to ensure it persists across sessions.

**Total estimated effort:** 7 developer-days

**Dependencies:**
- `@xenova/transformers`

**Risks:**
- ⚠️ **Browser OOM:** Transcribing very large audio files might crash the browser tab due to memory limits.
  *Mitigation:* Process audio in chunks rather than all at once.
- ⚠️ **Web Audio API limits:** Decoding long audio files might fail.
  *Mitigation:* Use chunked decoding or offload decoding to a separate WebAssembly module if needed.

### 📚 Resources

**Documentation:**
- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js/index)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

### 🎬 Next Steps

**If approved:**
1. Setup the Web Worker boilerplate.
2. Implement audio resampling logic in the browser.
3. Integrate Transformers.js and verify chunked transcription.

### 💬 Discussion Points
- Should we offer users a choice between "Local (Private, Slower)" and "Cloud (Fast, Requires Upload)" transcription?
- Which Whisper model size is the best balance of download size, speed, and accuracy for our target users?