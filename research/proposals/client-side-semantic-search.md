## 🔬 Researcher: Client-Side Semantic Search with Transformers.js

### 🎯 Executive Summary
Implement client-side semantic search using `@xenova/transformers` (Transformers.js) to replace the current server-side OpenAI implementation. This architecture eliminates external API costs for search, reduces latency by processing locally, and works efficiently entirely in the user's browser using WebAssembly.

### 💡 Problem Statement
**Current situation:**
The current semantic search (`src/app/api/search/route.ts`) relies on OpenAI's GPT-4 API to process transcription segments and identify relevant results. This requires sending chunks of transcripts over the network, incurring latency and per-request token costs.

**User impact:**
Users experience noticeable latency (often several seconds) when performing a semantic search because the frontend must wait for the server to batch the request and call the external OpenAI API.

**Example scenario:**
When a user searches for "fale sobre finanças" on a 2-hour podcast transcript, the application sends the entire text to the API, which might hit timeouts or result in heavy API usage costs, and the user must wait for the remote inference to finish.

### 🚀 Proposed Solution
**What:**
Migrate the semantic search feature to run entirely in the browser using the `@xenova/transformers` library and a lightweight embedding model like `Xenova/all-MiniLM-L6-v2`.

**How it works:**
1. The model is downloaded and cached in the browser upon the first search request.
2. The search query and the transcript segments are converted into vector embeddings locally.
3. A cosine similarity algorithm runs against the embeddings to find the most relevant segments.
4. Results are presented immediately without any server round-trips.

**Why this approach:**
It takes advantage of modern client devices' processing power via WebAssembly, dramatically reducing server costs and infrastructure dependency, while improving privacy since data never leaves the browser.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `@xenova/transformers`
- **Maturity:** Stable (widely used port of Hugging Face's transformers for JS)
- **Adoption:** Rapidly growing for Edge AI / local inference in browsers.
- **Community:** Active development, backed by Hugging Face ecosystem.
- **License:** Apache 2.0
- **Bundle size:** The library itself is relatively small. The `Xenova/all-MiniLM-L6-v2` model is around ~22MB, but it is downloaded asynchronously at runtime and cached by the browser.

**Competitive Analysis:**
Many modern local-first or privacy-focused apps (like Notion AI's local features or local note-taking apps) are moving towards client-side embeddings for quick retrieval without relying on heavy cloud APIs.

**Best Practices:**
- Use Web Workers to avoid blocking the UI thread during embedding generation.
- Cache the model using IndexedDB to avoid repeated downloads.
- Pre-compute embeddings for transcript segments incrementally in the background as the transcript becomes available.

### 🧪 Proof of Concept

**Implementation:**
The proof of concept script `research/pocs/client_side_search/semantic_search.js` demonstrates the core embedding and cosine similarity logic:

```javascript
import { pipeline } from '@xenova/transformers';

async function main() {
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  const segments = [
    "O dinheiro não traz felicidade, mas ajuda.",
    "A inteligência artificial está revolucionando a tecnologia.",
    "Investimentos em renda fixa são mais seguros.",
    "Os cachorros são os melhores amigos do homem."
  ];

  const query = "fale sobre finanças e economia";
  const queryEmbedding = await extractor(query, { pooling: 'mean', normalize: true });

  const results = [];

  for (let i = 0; i < segments.length; i++) {
    const docEmbedding = await extractor(segments[i], { pooling: 'mean', normalize: true });

    let similarity = 0;
    for (let j = 0; j < queryEmbedding.data.length; j++) {
      similarity += queryEmbedding.data[j] * docEmbedding.data[j];
    }

    results.push({ text: segments[i], score: similarity });
  }

  results.sort((a, b) => b.score - a.score);
  results.forEach(r => console.log(`[Score: ${r.score.toFixed(4)}] ${r.text}`));
}

main();
```

**Performance:**
- Before: Requires network roundtrip + OpenAI processing time (1-5s). Costs tokens per search.
- After: Initial search takes a few seconds (model download), subsequent searches are near-instant (<500ms). Costs $0.

### 📈 Value Proposition

**Benefits:**
- ✅ **Zero Cost:** Eliminates OpenAI API token costs for the semantic search feature.
- ✅ **Lower Latency:** After the initial model load, searches happen instantly locally.
- ✅ **Privacy:** Transcript segments are not sent to an external API for search.
- ✅ **Offline Capability:** Search can function completely offline once the model is cached.

**User stories:**
- As a user, I can quickly search through long transcripts without waiting for server responses, so that I can find highlights faster.

### ⚖️ Trade-offs

**Pros:**
- ✅ Saves API costs
- ✅ Drastically improves subsequent search speed
- ✅ Better data privacy

**Cons:**
- ❌ Initial download overhead (~22MB) for the model, affecting the very first search experience.
- ❌ Can be memory-intensive on lower-end devices.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Vector Database (Pinecone/Weaviate) | Fast, handles millions of records | Requires infrastructure setup, costs money | Not chosen because client-side handles typical transcript sizes easily without infra. |
| Fuse.js (Fuzzy Search) | Zero download, very fast | No semantic understanding, only lexical matching | Not chosen because users often search conceptually (e.g., "finanças" vs "dinheiro"). |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 days)
- [ ] Install `@xenova/transformers` library
- [ ] Create a Web Worker to handle model loading and inference off the main thread

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Implement the embedding pipeline and cosine similarity function in the worker
- [ ] Integrate the worker with the existing `TranscriptViewer` React component
- [ ] Add loading state for the model download progress

**Phase 3: Polish & Testing** (estimated: 1 days)
- [ ] Implement local caching strategies for segment embeddings
- [ ] Remove the server-side `/api/search` route
- [ ] Ensure gracefully fallback or clear error handling for incompatible browsers

**Total estimated effort:** 4 developer-days

**Dependencies:**
- `@xenova/transformers`

**Risks:**
- ⚠️ Main thread blocking if embeddings are generated on the UI thread - Mitigation: Use Web Workers.
- ⚠️ High memory usage on mobile devices - Mitigation: Use the quantized MiniLM model and limit batch sizes.

### 📚 Resources

**Documentation:**
- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js/index)
- [Xenova/all-MiniLM-L6-v2 Model Info](https://huggingface.co/Xenova/all-MiniLM-L6-v2)

**Examples:**
- [Transformers.js Web Worker Example](https://github.com/xenova/transformers.js/tree/main/examples/web-worker)

### 🎬 Next Steps

**If approved:**
1. Setup the Web Worker structure for client-side ML in the Next.js app.
2. Implement background embedding generation when a transcript is loaded.
3. Wire the search bar to the local worker instead of the API.

**Questions to resolve:**
- [ ] Do we want to pre-compute embeddings for all segments upon initial load, or just-in-time when searching?
- [ ] How should we indicate the model download progress to the user?

### 💬 Discussion Points
- The trade-off between the initial ~22MB download versus the API cost savings.
- Ensuring the UX is smooth during the first search while the model caches.
