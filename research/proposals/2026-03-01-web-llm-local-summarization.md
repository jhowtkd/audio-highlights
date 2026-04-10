## 🔬 Researcher: Client-Side LLM Inference for Highlight Generation

### 🎯 Executive Summary
Propose integrating `@mlc-ai/web-llm` to perform client-side highlight generation using local LLMs (like Llama-3-8B) via WebGPU. This feature will provide users with a zero-cost, privacy-first alternative to OpenAI API calls, significantly reducing API expenses for heavy users.

### 💡 Problem Statement
**Current situation:**
Highlight generation currently relies exclusively on the OpenAI API (`api/generate-highlights`).

**User impact:**
- **Cost:** API costs scale linearly with usage. Heavy users or those processing long podcasts can quickly rack up significant bills.
- **Privacy:** Users must send their transcripts to a third-party server, which might be a dealbreaker for sensitive corporate or legal content.
- **Connectivity:** Requires an active, stable internet connection to function.

**Example scenario:**
A user wants to generate highlights for a 4-hour confidential company meeting. Sending this to OpenAI costs money and violates their company's strict data privacy policies, so they cannot use our tool.

### 🚀 Proposed Solution
**What:**
Introduce an "AI Engine" toggle allowing users to choose between "Cloud (OpenAI/Groq)" and "Local (WebGPU)". The Local option will use `@mlc-ai/web-llm` to download and run a quantized model directly in their browser.

**How it works:**
1. User selects "Local AI" in settings.
2. The browser downloads a quantized model (e.g., Llama-3-8B-Instruct-q4f32_1-MLC) via WebLLM's caching system.
3. When generating highlights, the application passes the transcript to the local WebLLM engine instead of the `api/generate-highlights` endpoint.
4. Inference runs on the user's GPU via WebGPU, returning the JSON highlights.

**Why this approach:**
WebGPU provides near-native performance for machine learning models in the browser. Libraries like WebLLM have matured enough to run 8B parameter models reliably on modern consumer hardware, making client-side text processing a viable alternative to cloud APIs.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `@mlc-ai/web-llm`
- **Maturity:** Beta (Rapidly evolving, actively maintained by MLC AI).
- **Adoption:** Growing adoption for privacy-first local AI web apps.
- **Community:** Strong backing, multiple supported models (Llama 3, Phi-3, Mistral).
- **License:** Apache 2.0.
- **Hardware Requirements:** Requires WebGPU support (Chrome/Edge/Safari) and ideally 4GB+ VRAM for comfortable operation.

**Competitive Analysis:**
- Competitors typically force cloud processing. Offering local processing would be a strong differentiator for privacy-conscious users.

**Best Practices:**
- Use Cache API to store the model weights so subsequent loads are fast.
- Provide clear UI feedback during the initial model download (which can be 1-4GB).
- Detect WebGPU support and gracefully disable the "Local AI" option if unsupported.

### 🧪 Proof of Concept

**Implementation:**
```typescript
// See research/pocs/web-llm-summarization-poc.ts for full implementation
import { CreateMLCEngine } from "@mlc-ai/web-llm";

const engine = await CreateMLCEngine("Llama-3-8B-Instruct-q4f32_1-MLC", {
  initProgressCallback: (progress) => console.log(progress)
});

const reply = await engine.chat.completions.create({
  messages: [{ role: "user", content: "Summarize this transcript..." }]
});
```

**Performance:**
- **Initial Load:** ~1-3 minutes depending on network speed (downloads ~4GB of weights). Cached thereafter.
- **Inference Speed:** Varies by GPU. M1/M2 Macs or modern Nvidia GPUs can achieve 20-50 tokens/sec.
- **Quality:** High-quality results comparable to GPT-3.5 depending on the specific model used.

### 📈 Value Proposition

**Benefits:**
- ✅ **Zero Cost:** No API fees for generation.
- ✅ **Complete Privacy:** Transcripts never leave the user's device.
- ✅ **Offline Capability:** Once the model is cached, generation can happen offline.

**User stories:**
- As a **privacy-conscious user**, I want to **process my transcripts locally** so that **sensitive data is not sent to third-party servers.**
- As a **power user**, I want to **use local AI** so that **I don't have to pay high API costs for processing massive files.**

### ⚖️ Trade-offs

**Pros:**
- ✅ Privacy and cost benefits.
- ✅ Strong product differentiator.

**Cons:**
- ❌ Initial model download is very large.
- ❌ Requires modern hardware (WebGPU + VRAM). Not suitable for low-end devices or mobile.
- ❌ Increased complexity in state management (handling download progress, WebGPU compatibility checks).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Transformers.js (ONNX) | Easier setup | Slower for large generative models compared to MLC's compiled WebGPU approach. | Not chosen because generative tasks need maximum GPU acceleration. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Install `@mlc-ai/web-llm`.
- [ ] Implement `useWebLLM` hook to manage engine lifecycle and download progress.
- [ ] Add WebGPU feature detection.

**Phase 2: Core Feature** (estimated: 3 days)
- [ ] Add "AI Engine" toggle to ConfigPanel (Cloud vs. Local).
- [ ] Update `generate-highlights` logic to branch between API call and local WebLLM inference.
- [ ] Build download progress UI for the initial model caching phase.

**Phase 3: Polish & Testing** (estimated: 2 days)
- [ ] Test on different hardware (Mac, Windows PC).
- [ ] Add fallback logic if WebGPU context is lost or runs out of memory.

**Total estimated effort:** 7 developer-days

**Dependencies:**
- `@mlc-ai/web-llm`

**Risks:**
- ⚠️ **Hardware Fragmentation:** Users with older GPUs might experience crashes or extremely slow generation.
  - *Mitigation:* Explicitly label the feature as "Beta" and recommend hardware specs in the UI.

### 📚 Resources

**Documentation:**
- [WebLLM Official Site](https://webllm.mlc.ai/)
- [WebLLM GitHub](https://github.com/mlc-ai/web-llm)

### 🎬 Next Steps

**If approved:**
1. Merge the WebLLM dependency into `package.json`.
2. Build the `useWebLLM` hook and test it in isolation.
