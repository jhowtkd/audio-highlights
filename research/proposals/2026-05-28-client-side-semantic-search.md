## 🔬 Researcher: Client-Side Semantic Search

### 🎯 Executive Summary
Replace the current expensive and slow API-based semantic search with a privacy-first, zero-latency client-side solution using `transformers.js`. This allows users to instantly search through transcripts using natural language queries without sending data to external servers, significantly reducing costs and improving user experience.

### 💡 Problem Statement
**Current situation:**
The current `api/search` endpoint sends search queries and transcript chunks to OpenAI's API (`gpt-4o`).

**User impact:**
- **Latency:** Users experience delays (1-3s+) for every search query, discouraging exploration.
- **Cost:** Every search incurs API costs (input + output tokens).
- **Privacy:** User data (search queries and transcript content) is sent to a third party for simple retrieval tasks.
- **Connectivity:** Search requires an active internet connection.

**Example scenario:**
A user wants to find "that part about the budget" in a 2-hour podcast. They type "budget", wait 2 seconds, adjust to "financial report", and wait another 2 seconds. The friction discourages exploration, and every search attempt consumes API tokens for basic retrieval tasks.

### 🚀 Proposed Solution
**What:**
Implement client-side vector search using `@xenova/transformers`.

**How it works:**
1.  **Model Loading:** The browser downloads a lightweight embedding model (`Xenova/all-MiniLM-L6-v2`, ~23MB) once and caches it in a Web Worker to prevent UI blocking.
2.  **Indexing:** When a transcript is loaded, compute embeddings for all segments locally on the user's device.
3.  **Search:** Convert the user's query to an embedding and compute cosine similarity against segment embeddings to find semantic matches instantly.

**Why this approach:**
It moves the computation to the edge (user's device), completely eliminating API costs and search latency while ensuring data privacy by never transmitting transcript content for search.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `@xenova/transformers`
- **Maturity:** Stable (v2.17.2)
- **Adoption:** Growing standard for Web AI, backed by Hugging Face
- **Community:** 9.6k GitHub stars, 160k+ weekly npm downloads
- **License:** Apache-2.0
- **Bundle size:** Core library is manageable (~20-40MB for the quantized model data, cached after initial load)

**Competitive Analysis:**
- Product A (Otter.ai): Instant search, typically indexed server-side but highly optimized to feel local.
- Product B (Descript): Uses local indexing for instant search performance.
- Our App: Currently relies entirely on a server-side API dependency, making it slower and costlier than competitors.

**Best Practices:**
- Use a Web Worker to run inference so the main thread remains responsive.
- Cache the model using the browser Cache API.
- Use quantized models (int8) for faster inference and smaller download sizes.

### 🧪 Proof of Concept

**Implementation:**
```typescript
import { pipeline } from '@xenova/transformers';

// 1. Load Model (First time ~1.5s, then cached)
const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
  quantized: true,
});

// 2. Generate Embeddings (~8ms per segment)
const output = await extractor("A inteligência artificial está mudando o mundo.", {
  pooling: 'mean',
  normalize: true
});
const embedding = output.data;

// 3. Compute Cosine Similarity (< 5ms)
function cosineSimilarity(a: number[], b: number[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

**Demo:**
```bash
🚀 Starting Semantic Search POC...
📦 Loading model (Xenova/all-MiniLM-L6-v2)...
✅ Model loaded in 2.05s

📊 Generating embeddings for segments...

🔍 Running search queries...

Query: "AI technology"
   Top Match (Score: 0.3642): "Welcome to our podcast about artificial intelligence and the future of work."
   Time: 8.54ms

✨ POC Completed in 2.11s
```

**Performance:**
- Before: API Search latency ~1-3s (1000-3000ms).
- After: Local vector search <10ms per query.
- Impact: >100x speedup compared to API calls, enabling instant feedback.

### 📈 Value Proposition

**Benefits:**
- ✅ **Zero Cost:** No OpenAI API fees incurred for search queries.
- ✅ **Instant Feedback:** Search-as-you-type becomes a reality with sub-10ms latency.
- ✅ **Privacy:** Transcript data never leaves the user's device during search.
- ✅ **Offline Support:** Essential for PWA/Desktop-class feel, works without an active internet connection after the model is cached.

**User stories:**
- As a researcher, I can instantly filter through hours of audio to find specific quotes like "climate change" without waiting for a server response.
- As a developer, I don't have to worry about API rate limits or costs when users spam the search bar.

### ⚖️ Trade-offs

**Pros:**
- ✅ Free & Fast.
- ✅ Private.

**Cons:**
- ❌ **Initial Download:** Users must download the ~23MB model data on their first visit.
- ❌ **Memory Usage:** Loading the model and holding embeddings consumes some RAM (~100-200MB).
- ❌ **Device Dependent:** Performance relies on the user's hardware; extremely old mobile devices may struggle with WebAssembly inference.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Server-side Vector DB (Pinecone) | Fast, scalable | Costly, complex infrastructure | Not chosen (overkill for single-user transient sessions) |
| Keyword Search (Regex) | Instant, 0 memory overhead | No semantic understanding (misses context) | Not chosen (inferior UX) |
| Current (GPT-4) | High accuracy | Slow, expensive, privacy concerns | Replacing this |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 days)
- [ ] Install `@xenova/transformers`.
- [ ] Create `src/lib/search-worker.ts` to handle model loading and inference in a background thread.
- [ ] Implement model caching strategy.

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Update `TranscriptViewer` to instantiate the worker.
- [ ] Implement "indexing" (generating embeddings) when a transcript is loaded.
- [ ] Replace `/api/search` API calls with worker message passing.

**Phase 3: Polish & Testing** (estimated: 1 days)
- [ ] Add loading state UI ("Downloading search model...").
- [ ] Add fallback to keyword search if WASM fails.
- [ ] Measure memory impact and optimize if necessary.

**Total estimated effort:** 4 developer-days

**Dependencies:**
- `@xenova/transformers`

**Risks:**
- ⚠️ **Mobile Performance:** Older phones might struggle with model inference. - Mitigation: Disable semantic search on low-power devices or default to simple keyword search.
- ⚠️ **Browser Compatibility:** Requires WebAssembly support. - Mitigation: Use polyfills or keyword search fallback if WASM is unavailable.

### 📚 Resources

**Documentation:**
- [Transformers.js Docs](https://huggingface.co/docs/transformers.js/index)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

**Examples:**
- [Transformers.js Semantic Search Example](https://github.com/xenova/transformers.js/tree/main/examples/semantic-search)

**Community:**
- [Hugging Face Transformers.js Repository](https://github.com/xenova/transformers.js)

### 🎬 Next Steps

**If approved:**
1. Install `@xenova/transformers`.
2. Create the Web Worker infrastructure.
3. Refactor `TranscriptViewer` to remove server API calls.

**Questions to resolve:**
- [ ] Should we keep the server-side API as a fallback for older devices?
- [ ] Is the ~23MB download acceptable for mobile users on cellular data, or should we ask for permission/restrict to Wi-Fi?

### 💬 Discussion Points
- How do we handle extremely long transcripts (e.g., 4+ hours)? Should we paginate the embedding generation to avoid UI lag if not using a worker, or does the worker handle this gracefully enough?