## 🔬 Researcher: Local LLM Highlight Generation (WebLLM)

### 🎯 Executive Summary
Replace the costly, server-side GPT-4o highlight generation with a 100% local, client-side solution using **WebLLM and WebGPU**. This allows users to generate viral clips entirely on their device, guaranteeing absolute privacy and eliminating OpenAI API costs.

### 💡 Problem Statement
**Current situation:**
The application relies on `/api/highlights` which calls OpenAI's GPT-4o API to analyze transcript segments and suggest viral highlights.

**User impact:**
- **Cost:** GPT-4o API calls are expensive, especially for long, multi-hour podcast transcripts.
- **Privacy:** Sensitive unreleased audio/transcripts are sent to OpenAI servers.
- **Rate Limits:** Heavy usage can trigger API limits, failing the generation process.

**Example scenario:**
A journalist wants to generate highlights from an embargoed, highly sensitive interview. They cannot use the feature because they are legally forbidden from sending the transcript to third-party cloud LLMs.

### 🚀 Proposed Solution
**What:**
Implement client-side highlight generation using [`@mlc-ai/web-llm`](https://github.com/mlc-ai/web-llm).

**How it works:**
1. The browser leverages WebGPU to load an optimized, quantized LLM (e.g., `Phi-3-mini-4k-instruct` or `Llama-3-8B-Instruct`) into local VRAM.
2. The transcript and system prompt are processed entirely by the local model.
3. The result is returned in standard JSON format, exactly mimicking the current OpenAI response structure.

**Why this approach:**
- **Zero API Cost:** Inference runs locally.
- **Privacy First:** Data never leaves the browser.
- **Modern Standards:** WebGPU is now broadly available in Chrome, Edge, and Safari Technology Preview.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `@mlc-ai/web-llm`
- **Maturity:** Stable (v0.2.x)
- **Model:** `Phi-3-mini-4k-instruct-q4f16_1-MLC` (~2.2GB download)
- **Community:** Highly active, backed by MLC-AI.
- **Hardware Requirement:** Requires a GPU and a WebGPU-enabled browser.

**Competitive Analysis:**
- **MacWhisper / Msty:** Native apps are moving towards local LLMs for privacy.
- **Our App:** Currently cloud-dependent.

**Best Practices:**
- Use a Web Worker for WebLLM to avoid freezing the UI thread during inference.
- Implement robust `initProgressCallback` to show users the download status of the model weights.

### 🧪 Proof of Concept

**Implementation:**
A conceptual POC has been created in `research/pocs/webllm-highlight-poc.ts` demonstrating the `CreateWebWorkerMLCEngine` instantiation.

```javascript
import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";

// Load model via Web Worker
const engine = await CreateWebWorkerMLCEngine(
  new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }),
  "Phi-3-mini-4k-instruct-q4f16_1-MLC",
  { initProgressCallback: (progress) => setProgress(progress.text) }
);

// Generate
const reply = await engine.chat.completions.create({
  messages: [{ role: "user", content: prompt }],
});
```

**Performance:**
- **Model Download:** 1-2 minutes on first run (cached subsequently).
- **Inference Speed:** 20-50 tokens/sec on an M1/M2 Mac or dedicated PC GPU.

### 📈 Value Proposition

**Benefits:**
- ✅ **Absolute Privacy:** Enterprise and journalism users can process sensitive data.
- ✅ **Cost Elimination:** Removes the single biggest variable cost of operating the app.
- ✅ **Offline Capable:** Once the model is cached, highlights can be generated offline.

**User stories:**
- As a privacy-conscious user, I can generate clips locally so my data remains confidential.
- As an app owner, I don't pay OpenAI for heavy users.

### ⚖️ Trade-offs

**Pros:**
- ✅ Free & Private.
- ✅ No rate limits.

**Cons:**
- ❌ **Hardware Bound:** Fails on older devices without WebGPU or insufficient RAM.
- ❌ **Initial Download:** Requires downloading 2-4GB of model weights on first use.
- ❌ **Quality:** `Phi-3-mini` might be slightly less capable than GPT-4o at complex reasoning, though usually sufficient for summarization.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Cloud open-source (Groq) | Very fast, cheaper | Still requires data upload | Keep as fallback |
| Transformers.js | Lightweight | Not suitable for generative instruction tasks | Not chosen |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Install `@mlc-ai/web-llm`.
- [ ] Create Web Worker for LLM inference.
- [ ] Implement model caching logic.

**Phase 2: UI Integration** (estimated: 2 days)
- [ ] Add toggle in Settings: "Use Local AI (Private & Free)".
- [ ] Build download progress UI for the 2GB model weights.
- [ ] Switch `generateHighlights` API call to the local worker if enabled.

**Total estimated effort:** 4 developer-days

**Dependencies:**
- `@mlc-ai/web-llm`

**Risks:**
- ⚠️ **WebGPU Support:** Safari support is still experimental.
  - *Mitigation:* Gracefully fallback to cloud GPT-4o if WebGPU is not detected.

### 📚 Resources

**Documentation:**
- [WebLLM Docs](https://webllm.mlc.ai/)

### 🎬 Next Steps

**If approved:**
1. Install `@mlc-ai/web-llm`.
2. Build the Web Worker infrastructure.
3. Test inference quality vs GPT-4o.
