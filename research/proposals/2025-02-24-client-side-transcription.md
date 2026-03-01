## 🔬 Researcher: Client-Side Audio Transcription with Transformers.js

### 🎯 Executive Summary
This proposal recommends implementing client-side audio transcription using **Transformers.js** and the **Whisper Tiny** model. By moving transcription from the server/API to the user's browser, we can eliminate recurring API costs, reduce latency by avoiding file uploads, and enhance user privacy, while enabling offline functionality.

### 💡 Problem Statement
**Current situation:**
The application currently relies on the Groq Whisper API for transcription. This involves uploading audio files to the server, then sending them to an external API.

**User impact:**
- **Latency:** Users must wait for the upload to complete before transcription begins. For large files or slow connections, this is a significant bottleneck.
- **Privacy:** User audio data leaves their device, which may be a concern for sensitive content.
- **Cost:** As the user base grows, API costs for transcription will scale linearly.
- **Connectivity:** Transcription requires an active internet connection.

**Example scenario:**
A user records a 30-minute podcast interview. They must upload the 50MB file to our server (taking 2-3 minutes on 4G), which then sends it to Groq. If the upload fails at 99%, they must restart.

### 🚀 Proposed Solution
**What:**
Implement client-side transcription using `@xenova/transformers` (Transformers.js) running WebAssembly in the browser.

**How it works:**
1.  The application downloads the quantized `Xenova/whisper-tiny` model (approx. 75MB) to the browser cache.
2.  Audio input is processed locally using the user's CPU/GPU via ONNX Runtime Web.
3.  Transcription results are generated in real-time or near real-time without uploading the file.

**Why this approach:**
Transformers.js provides a seamless, browser-compatible implementation of state-of-the-art models. The Whisper Tiny model offers a good balance of accuracy and performance for client-side execution, and the architecture supports falling back to server-side transcription if the client device is too slow.

### 📊 Research Findings

**Technology Analysis:**
- **Library:** `@xenova/transformers` (v2.x)
- **Model:** `Xenova/whisper-tiny` (Quantized)
- **Maturity:** Stable (widely used in Hugging Face Spaces and web apps)
- **Adoption:** 8k+ GitHub stars, used by Xenova and others.
- **License:** Apache 2.0 (Library), MIT (Model weights).
- **Bundle size:** Library is ~2MB (gzipped), Model is ~75MB (cached indefinitely).

**Competitive Analysis:**
- **Product A (Otter.ai):** Server-side processing (high accuracy, high cost).
- **Product B (Good Tape):** Server-side processing.
- **Product C (Buzz):** Desktop app with local Whisper (offline capable).
- **Our Advantage:** Web-based offline capability without installing a desktop app.

**Best Practices:**
- Use Web Workers to prevent blocking the main thread during inference.
- Implement a "hybrid" approach: Default to client-side, offer server-side for higher accuracy (Whisper Large) or unsupported devices.
- Cache models using the Cache API to avoid re-downloading.

### 🧪 Proof of Concept

**Implementation:**
A POC script (`research/whisper_poc.js`) was created to validate the model loading and execution in the Node.js environment (simulating the runtime logic).

```javascript
// research/whisper_poc.js snippet
const { pipeline } = require('@xenova/transformers');
// ... audio loading logic ...
const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
const output = await transcriber(audioData);
```

**Results:**
- **Environment:** Node.js (Sandbox)
- **Model Load Time:** ~1.30s (server-grade CPU)
- **Inference Time:** ~4.09s for 5s audio (0.8x real-time on CPU, likely faster with GPU acceleration in browser).
- **Accuracy:** The pipeline successfully executed and returned a result object.

### 📈 Value Proposition

**Benefits:**
- ✅ **Zero Marginal Cost:** No API fees per minute of audio.
- ✅ **Instant Feedback:** Transcription starts immediately; no upload wait time.
- ✅ **Privacy First:** Data stays on the device.
- ✅ **Offline Capable:** Works on airplanes or weak connections.

**User stories:**
- As a **journalist**, I can transcribe sensitive interviews without uploading them to the cloud.
- As a **commuter**, I can transcribe voice notes on the subway without internet access.

### ⚖️ Trade-offs

**Pros:**
- ✅ Eliminates API costs.
- ✅ Improves privacy and perceived speed.
- ✅ Enables offline workflows.

**Cons:**
- ❌ Initial download (75MB) might be heavy for some mobile users.
- ❌ Battery drain on mobile devices during processing.
- ❌ Lower accuracy (Whisper Tiny) compared to server-side Large-v3 models.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Whisper Base/Small** | Higher accuracy | Larger download (150MB+), slower | Rejected for initial implementation (too heavy). |
| **Web Speech API** | Native, zero download | Poor accuracy, requires online (Chrome), inconsistent | Rejected due to quality issues. |
| **Tflite / ONNX (Manual)** | Fine-grained control | High complexity to implement | Rejected in favor of Transformers.js abstraction. |

### 🛠️ Implementation Plan

**Phase 1: Foundation (estimated: 2 days)**
- [ ] Add `@xenova/transformers` dependency.
- [ ] Create a Web Worker for transcription to keep UI responsive.
- [ ] Implement model caching/loading UI ("Downloading model...").

**Phase 2: Core Feature (estimated: 3 days)**
- [ ] Integrate with `useFFmpeg` hook to preprocess audio.
- [ ] Replace/Augment the "Transcribe" button action.
- [ ] Handle transcription progress events.

**Phase 3: Polish & Fallback (estimated: 2 days)**
- [ ] Add toggle for "High Quality (Server)" vs "Fast (Device)".
- [ ] Error handling for low-memory devices (fallback to server).
- [ ] Telemetry for performance monitoring.

**Total estimated effort:** 7 developer-days

**Dependencies:**
- `@xenova/transformers`
- Web Workers API

**Risks:**
- ⚠️ **Memory Limits:** Mobile browsers might kill the tab if memory usage spikes.
  - *Mitigation:* Use quantized models and process audio in chunks.
- ⚠️ **Browser Support:** Requires WebAssembly and SIMD support (available in modern browsers).

### 📚 Resources

**Documentation:**
- [Transformers.js Docs](https://huggingface.co/docs/transformers.js/index)
- [Whisper Model Card](https://huggingface.co/Xenova/whisper-tiny)

**Examples:**
- [Whisper Web Demo](https://huggingface.co/spaces/Xenova/whisper-web)

### 🎬 Next Steps

**If approved:**
1. Install `@xenova/transformers`.
2. Prototype the Web Worker implementation.
3. Measure performance on low-end devices.

**Questions to resolve:**
- [ ] Is Whisper Tiny accurate enough for our specific use case (Portuguese accents)?
- [ ] Should we bundle the model or download on demand? (Download on demand recommended).

### 💬 Discussion Points
- Should we default to Client-side or Server-side? (Proposal: Default to Client-side for files < 10 mins).
- Can we use the client-side model to generate "draft" transcripts while the server generates "final" ones?
