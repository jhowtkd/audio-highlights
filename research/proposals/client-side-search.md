## 🔬 Researcher: Client-Side Semantic Search

### 🎯 Executive Summary
Replace the current server-side, expensive OpenAI-based search with a **client-side semantic search** using `@xenova/transformers`. This will reduce API costs to zero for search, eliminate network latency for results, and enable offline search capabilities, all while maintaining high relevance using state-of-the-art embeddings.

### 💡 Problem Statement
**Current situation:**
The current search implementation (`src/app/api/search/route.ts`) sends transcription segments to OpenAI's GPT-4o model to find relevant matches.
1.  **Cost:** Every search query incurs API costs (input tokens for the *entire* transcript chunk + output tokens).
2.  **Latency:** Users wait for a round-trip to the server and OpenAI's generation time.
3.  **Redundancy:** The same static transcript is re-processed by the LLM for every query.

**User impact:**
Users experience a delay when searching. High usage could lead to significant operational costs.

**Example scenario:**
A user searches for "marketing strategy" in a 2-hour podcast. The server chunks the transcript (approx. 20k tokens) and sends multiple requests to OpenAI. This might cost ~$0.20 per search and take 3-5 seconds. With client-side search, it costs $0 and takes <300ms.

### 🚀 Proposed Solution
**What:**
Implement in-browser semantic search using **transformers.js** and the **all-MiniLM-L6-v2** model (quantized).

**How it works:**
1.  **Initialization:** When a transcript is loaded, the browser downloads the model (~23MB, cached) and generates embeddings for all segments in a Web Worker.
2.  **Search:** When the user types a query, we generate its embedding and calculate Cosine Similarity against the segment embeddings locally.
3.  **Result:** Top matches are displayed instantly.

**Why this approach:**
-   **Zero Marginal Cost:** Run entirely on the user's device.
-   **Privacy:** Transcript data never leaves the client for search.
-   **Speed:** Vector math on small datasets (podcast transcripts) is sub-millisecond.

### 📊 Research Findings

**Technology Analysis:**
-   **Library:** `@xenova/transformers` (v2.17.2)
-   **Model:** `Xenova/all-MiniLM-L6-v2` (Quantized to INT8)
-   **Maturity:** Stable, widely used in web AI demos.
-   **Performance:** ~200ms for query embedding. Search over 1000 segments is negligible.
-   **Bundle size:** The library is lightweight, but the model is ~23MB (downloaded once).

**Competitive Analysis:**
-   **Descript:** Uses local indexing for instant text search.
-   **Glean:** Enterprise search, heavily relies on vector search.
-   **Our App (Current):** Server-side LLM (slow, expensive).

### 🧪 Proof of Concept

**Implementation:**
A POC was implemented in `src/app/poc-search/page.tsx`.
Due to Turbopack/Next.js bundling strictness with WASM/Node polyfills, the most robust integration method found was using a native dynamic import from a CDN.

```typescript
// Client-side initialization
const { pipeline, env } = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
env.allowLocalModels = false;
const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

// Search Logic
const output = await extractor(query, { pooling: 'mean', normalize: true });
const embedding = output.data;
// ... perform dot product with cached segment embeddings ...
```

**Demo:**
(POC demonstrated successful search for "coding and programming" matching "Coding requires patience..." with 62.9% confidence in ~200ms)

**Performance:**
-   **Model Load:** ~2-5s (first time), instant (cached).
-   **Search Time:** ~200ms (mostly embedding generation).

### 📈 Value Proposition

**Benefits:**
-   ✅ **Cost Savings:** Eliminate OpenAI API calls for search.
-   ✅ **Speed:** Instant results after initial indexing.
-   ✅ **Offline:** Works without internet connection once loaded.

**User stories:**
-   As a researcher, I can search for "climate change" in a downloaded interview and jump to relevant sections instantly, even on a plane.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Free, Fast, Private.
-   ✅ Modern "AI Engineer" approach.

**Cons:**
-   ❌ **Initial Load:** 23MB download for the model.
-   ❌ **Memory:** Storing embeddings in RAM (negligible for typical podcasts).
-   ❌ **Complexity:** Requires handling Web Workers to avoid blocking UI during indexing.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Fuse.js** | Tiny, fast, no model download. | Keyword only (no semantic understanding). | Rejected (Need semantic). |
| **Server-side Vector DB** | Fast, scalable to millions of docs. | Infrastructure cost, complexity. | Rejected (Overkill for single file). |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
-   [ ] Create `useSemanticSearch` hook.
-   [ ] Implement Web Worker for embedding generation (to keep UI responsive).
-   [ ] Integrate `transformers.js` via CDN import (bypassing bundler issues).

**Phase 2: Integration** (estimated: 2 days)
-   [ ] Replace current Search API call in `TranscriptViewer` with client-side hook.
-   [ ] Add progress indicator for "Indexing Transcript...".

**Phase 3: Polish** (estimated: 1 day)
-   [ ] Cache embeddings in IndexedDB (using the proposed Offline Persistence layer) to avoid re-indexing.

**Total estimated effort:** 5 developer-days

**Dependencies:**
-   `@xenova/transformers` (loaded via CDN or properly configured bundler)

**Risks:**
-   ⚠️ **Browser Compatibility:** WASM support required (available in all modern browsers).
-   ⚠️ **Mobile Performance:** Older phones might struggle with model inference. Mitigation: Fallback to keyword search (Fuse.js).
-   ⚠️ **CDN Reliance:** The POC used CDN for ease of integration. Production implementation should ideally bundle the library or self-host the script to ensure reliability and security.

### 📚 Resources

**Documentation:**
-   [Transformers.js Docs](https://huggingface.co/docs/transformers.js/index)

**Community:**
-   [Hugging Face Web AI](https://huggingface.co/tasks/sentence-similarity)

### 🎬 Next Steps

**If approved:**
1.  Prototype the Web Worker implementation.
2.  Measure indexing time for a 1-hour transcript.
