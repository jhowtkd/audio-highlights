## 🔬 Researcher: Client-Side Highlight Generation with WebLLM

### 🎯 Executive Summary
I propose migrating the highlight generation logic from the server-side OpenAI API to **client-side execution using WebLLM and WebGPU**. By running a quantized Small Language Model (SLM) like Llama-3-8B directly in the user's browser, we can completely eliminate recurring API costs for the core feature of the application, enhance user privacy, and enable full offline functionality.

### 💡 Problem Statement
**Current situation:**
The core value proposition of AudioHighlights is identifying the best moments in a transcript (`src/app/api/highlights/route.ts`). This is currently powered by OpenAI's GPT-4o (or similar models).
Every time a user generates highlights:
1.  The entire transcript is sent to OpenAI.
2.  OpenAI processes the prompt and returns a JSON response.
3.  The application parses this and displays the highlights.

**User impact:**
- **Cost:** This is the most expensive operation in the application. Long transcripts consume significant input tokens, scaling linearly with usage.
- **Privacy:** Sensitive transcripts must be sent to a third-party server.
- **Connectivity:** Requires an active internet connection.

**Example scenario:**
A user has a 2-hour podcast transcript (~20k tokens). Generating 10 highlights with GPT-4o costs roughly $0.10-$0.20 per request. If 1,000 users do this daily, it costs hundreds of dollars a month.

### 🚀 Proposed Solution
**What:**
Implement client-side highlight generation using `@mlc.ai/web-llm` to run models like `Llama-3-8B-Instruct-q4f32_1-MLC` natively in the browser via WebGPU.

**How it works:**
1.  **Initialization:** The app checks for WebGPU support. If available, it prompts the user to download the model (~4-5GB) to their browser cache (IndexedDB).
2.  **Prompting:** We reuse the existing prompt logic (`buildPrompt`), but instead of sending it to `/api/highlights`, we send it to the local WebLLM engine.
3.  **JSON Generation:** We configure the WebLLM engine to output strictly structured JSON matching our `GeneratedHighlight` schema.
4.  **Fallback:** If WebGPU is not available or the device is too weak, gracefully fallback to the existing server-side OpenAI implementation.

**Why this approach:**
WebLLM brings state-of-the-art LLMs to the browser with hardware acceleration. Modern laptops (M1/M2/M3 Macs, recent Windows PCs with dedicated GPUs) have more than enough unified memory to run a 4-bit quantized 8B parameter model smoothly. This shifts the compute cost entirely to the user's hardware.

### 📊 Research Findings

**Technology Analysis:**
- **Library:** `@mlc.ai/web-llm`
- **Model:** `Llama-3-8B-Instruct` (Quantized to 4-bit) or `Phi-3-mini` (smaller, ~2GB).
- **Maturity:** Production-ready for capable hardware.
- **Performance:** 20-50+ tokens/second on M-series Macs.
- **Bundle size:** The JS library is small. The model weights are large (2-5GB) but cached permanently via IndexedDB.

**Competitive Analysis:**
- Web-based AI apps are increasingly adopting local-first strategies (e.g., WebGPU implementations of Whisper and Stable Diffusion) to avoid ruinous API costs.

**Best Practices:**
- Always provide a clear UI indicating model download progress.
- Implement robust error handling for out-of-memory (OOM) errors.
- Use a "hybrid" approach: Try local first, fallback to cloud.

### 🧪 Proof of Concept

**Implementation:**
A syntax POC (`research/pocs/webllm_poc.js`) was created to outline the API integration. In a real browser environment:

```javascript
import { CreateMLCEngine } from "@mlc.ai/web-llm";

// 1. Initialize Engine
const engine = await CreateMLCEngine("Llama-3-8B-Instruct-q4f32_1-MLC", {
  initProgressCallback: (progress) => console.log(progress.text) // Update UI
});

// 2. Generate Highlights (using JSON mode if supported, or strict prompting)
const messages = [
  { role: "system", content: "You are an expert at finding podcast highlights. Return ONLY valid JSON." },
  { role: "user", content: promptWithTranscript }
];

const reply = await engine.chat.completions.create({ messages });
const jsonResult = JSON.parse(reply.choices[0].message.content);
```

### 📈 Value Proposition

**Benefits:**
- ✅ **Massive Cost Reduction:** Eliminates the primary recurring API expense.
- ✅ **Privacy:** Transcripts stay on the user's device.
- ✅ **Offline Capable:** Unlocks the ability to generate highlights on an airplane (if combined with client-side transcription).

**User stories:**
- As a **power user**, I want to generate highlights locally to ensure my unreleased podcast audio isn't sent to cloud providers.
- As the **application owner**, I want to offer a "Local Compute" mode to reduce my OpenAI bill.

### ⚖️ Trade-offs

**Pros:**
- ✅ Zero marginal cost per query.
- ✅ Enhanced privacy.

**Cons:**
- ❌ **Hardware Requirements:** Requires a relatively modern device with WebGPU support and sufficient RAM (8GB+).
- ❌ **Initial Setup:** The first run requires downloading gigabytes of model weights, taking minutes depending on connection speed.
- ❌ **Battery Drain:** High GPU utilization on mobile/laptops.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Stick with OpenAI** | Fast, works on any device. | Expensive, privacy concerns. | Keep as fallback, not primary. |
| **Server-side Ollama** | Cheaper than OpenAI. | Still requires hosting expensive GPU servers. | Rejected (Doesn't solve infrastructure cost). |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Install `@mlc.ai/web-llm`.
- [ ] Create a `useWebLLM` hook to manage engine initialization, model downloading, and caching.
- [ ] Add a UI toggle in `ConfigPanel`: "Use Local AI (Free, Requires Good PC)" vs "Use Cloud AI (Fast)".

**Phase 2: Integration** (estimated: 3 days)
- [ ] Refactor the highlight generation action to route through the local engine if selected.
- [ ] Ensure the prompt engineering works reliably with Llama-3/Phi-3 for JSON output.
- [ ] Implement robust parsing of the local model's output.

**Phase 3: Polish & Fallbacks** (estimated: 2 days)
- [ ] Handle WebGPU unsupported errors gracefully.
- [ ] Add detailed progress bars for the model download phase.

**Total estimated effort:** 7 developer-days

**Dependencies:**
- `@mlc.ai/web-llm`

### 📚 Resources

**Documentation:**
- [WebLLM Documentation](https://webllm.mlc.ai/)
- [WebGPU Support Matrix](https://caniuse.com/webgpu)

### 🎬 Next Steps

**If approved:**
1. Install `@mlc.ai/web-llm` in the frontend project.
2. Build a hidden `/test-webllm` route to validate model generation quality on typical transcripts.
