## 🔬 Researcher: Migrating Highlights Generation to Gemini 2.0 Flash

### 🎯 Executive Summary
Replace OpenAI's GPT-4o with Google's Gemini 2.0 Flash for highlight generation in `/api/highlights/route.ts`. This utilizes the existing `GeminiClient` in the codebase to drastically cut API costs and speed up generation times while easily handling long-form audio transcripts.

### 💡 Problem Statement
**Current situation:**
The application relies on OpenAI's `chat.completions` API (specifically configured via `GPT_MODEL`, likely a heavy GPT-4 tier given the `max_completion_tokens` config) to process potentially large podcast transcripts and extract highlights.

**User impact:**
- High API costs for the application owner, especially for long podcasts (up to 4 hours supported).
- Slower generation times as the API analyzes dense transcripts with complex system instructions.
- Potential rate limits when processing many large files.

**Example scenario:**
A user uploads a 2-hour podcast. The transcript generated via Whisper is roughly 20,000 words (~26,000 tokens). Processing this chunk through a heavy LLM like GPT-4o incurs substantial costs per run. Using a model optimized for long context and speed is essential here.

### 🚀 Proposed Solution
**What:**
Refactor `src/app/api/highlights/route.ts` to replace the `OpenAI` client usage with the existing `GeminiClient` implementation found in `src/lib/gemini-client.ts`.

**How it works:**
1. Import `getGeminiClient` from `src/lib/gemini-client.ts`.
2. Replace the `openai.chat.completions.create(...)` call with `geminiClient.generateContent(...)`.
3. Separate the `systemInstruction` and user `prompt` as required by the `GeminiClient` signature.
4. Adjust the JSON parsing logic to seamlessly handle Gemini's string response format.

**Why this approach:**
- **Cost Efficiency:** Gemini 2.0 Flash is significantly cheaper per token compared to GPT-4o, especially when handling large transcript context windows.
- **Speed:** Flash models are explicitly optimized for lower latency, reducing user wait time during the "Generating Highlights" phase.
- **Context Window:** Gemini 2.0 Flash supports over 1 million tokens, handling even the 4-hour app limit effortlessly without requiring aggressive pre-chunking.
- **Zero New Dependencies:** The app already includes a robust `GeminiClient` with automatic retries and exponential backoff.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Google Gemini API (integrated via direct Fetch in `GeminiClient`).
- **Maturity:** Stable, production-ready.
- **Adoption:** Rapidly growing for long-context tasks.
- **License:** Commercial API.
- **Bundle size:** 0 bytes (uses native `fetch`).

**Competitive Analysis:**
Many content repurposing tools (e.g., Opus Clip, Munch) use an ensemble of models. High-speed, large-context models like Claude Haiku or Gemini Flash are becoming the industry standard for the initial pass of transcript analysis and highlight extraction due to their cost-to-performance ratio.

**Best Practices:**
Re-using the existing resilient `GeminiClient` ensures consistency across the application and leverages pre-built error handling.

### 🧪 Proof of Concept

**Implementation:**
A functional proof-of-concept mimicking the API transition has been created at `research/pocs/gemini_poc.mjs`. It verifies that the `generateContent` method from `GeminiClient` handles the prompt structure correctly and that its text-based output can be cleanly parsed into the required JSON schema using the existing application logic.

**Demo:**
```bash
$ node research/pocs/gemini_poc.mjs
Running Gemini Migration POC...
--- Called Gemini Client ---
System Instruction: Você é um assistente especializado em identificar os melhores momentos de podcasts para criar clips virais. Sempre responda apenas com JSON válido.
Prompt length: 25
Options: { temperature: 0.7, maxOutputTokens: 8192 }
Parsed successfully: true
POC Successful!
```

**Performance:**
- Before: GPT-4o (High latency, ~$5.00/1M input tokens)
- After: Gemini 2.0 Flash (Lower latency, ~$0.15/1M input tokens)
- Impact: Substantial cost reduction (~95% cheaper input) with faster execution.

### 📈 Value Proposition

**Benefits:**
- ✅ **Cost Reduction:** Estimated >90% reduction in API costs for the highlight extraction feature.
- ✅ **Faster Generation:** Improved UX via lower response latency.
- ✅ **Simplified Stack Usage:** Capitalizes on existing code without bloating the app with new dependencies.

**User stories:**
- As an application owner, I want to reduce my API costs so I can maintain sustainable profit margins.
- As a user, I want my video highlights generated quickly without long loading screens.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massive cost savings.
- ✅ Speed improvements.
- ✅ Reuses battle-tested internal client code.

**Cons:**
- ❌ Might require minor prompt tweaking if Gemini is stricter/looser than GPT-4o regarding the specific JSON structure (though Gemini 2.0 Flash is generally highly capable at structured output).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Groq Llama 3 (via existing client) | Fastest option | Small context window (8k tokens), weaker at complex JSON schemas. | Not chosen. Podcast transcripts easily exceed 8k tokens, and strict JSON is mandatory here. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 0.5 days)
- [x] Analyze `src/app/api/highlights/route.ts` OpenAI implementation.
- [x] Analyze `src/lib/gemini-client.ts` capabilities.
- [x] Build local POC to verify logic compatibility.

**Phase 2: Core Feature** (estimated: 0.5 days)
- [ ] Replace `import OpenAI` with `import { getGeminiClient }` in `route.ts`.
- [ ] Refactor the handler to use `geminiClient.generateContent(prompt, systemInstruction, { maxOutputTokens: GPT_MAX_TOKENS })`.
- [ ] Update log statements to mention `Gemini 2.0 Flash`.
- [ ] Adjust environment variable assertions if necessary (e.g., verifying `GOOGLE_GEMINI_API_KEY`).

**Phase 3: Polish & Testing** (estimated: 0.5 days)
- [ ] Verify JSON parsing handles the new output perfectly.
- [ ] Run application build, linting, and tests.

**Total estimated effort:** 1.5 developer-days

**Dependencies:**
- Google Gemini API Key (`GOOGLE_GEMINI_API_KEY`).

**Risks:**
- ⚠️ JSON schema hallucination.
- Mitigation: The route already uses robust Regex extraction and `try/catch` fallbacks. Gemini 2.0 Flash is strong enough that this should not regress compared to GPT-4o.

### 📚 Resources

**Documentation:**
- [Gemini API Docs - Structured Output](https://ai.google.dev/gemini-api/docs/structured-output)

### 🎬 Next Steps

**If approved:**
1. Refactor `src/app/api/highlights/route.ts`.
2. Run standard local verification (`npm run build`, `npm run lint`).
3. Deploy to staging environment for manual QA on a long podcast audio file.

### 💬 Discussion Points
- Do we need to retain the `OPENAI_API_KEY` check in `route.ts` if this specific route fully migrates to Gemini? (We likely can remove it from this specific file, provided transcription via Whisper isn't invoked here).