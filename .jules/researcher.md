## 2024-05-22 - Audio Visualization Research

**Research Topic:** Improving Audio Navigation and Visualization

**Finding:**
Current implementation (`src/components/audio/waveform.tsx`) uses a custom Canvas solution that:
- Decodes full audio file (memory intensive).
- Has fixed resolution (200 samples).
- Lacks zoom.

**Decision:**
Propose upgrading to `wavesurfer.js` to enable Zoom, Regions, and better performance handling (streaming/peaks).

**Learning:**
Custom canvas implementations for audio waveforms are hard to maintain and often miss critical features like zooming which users expect from professional tools.

**Resources:**
- https://wavesurfer.xyz/

## 2024-05-24 - Offline Persistence & Storage

**Research Topic:** Robust Client-Side Persistence for Large Audio/Transcript Data

**Finding:**
Current architecture uses:
- `localStorage` for task metadata (limited to ~5MB).
- In-memory `useRef` for `File` objects.
Result: Reloading the page loses the source audio file (requiring re-upload) and large transcripts risk quota errors.

**Decision:**
Propose implementing IndexedDB (via `idb`) to store:
1. Source audio files (Blobs).
2. Full transcription JSONs.
This enables true offline resume capability and handles large datasets safely.

**Learning:**
React's `useRef`/`useState` + `localStorage` is insufficient for "heavy" client-side apps dealing with media files. IndexedDB is essential for preserving state across reloads for file-based workflows.

**Resources:**
- https://github.com/jakearchibald/idb
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

## 2025-02-19 - Client-Side Semantic Search

**Research Topic:** Replacing server-side search with in-browser semantic search.

**Finding:**
Currently, search uses OpenAI API (`gpt-4o`), which is slow, expensive, and non-private.
Evaluated `@xenova/transformers` with `all-MiniLM-L6-v2`.
- POC showed ~8s model load (cached) and <100ms search latency.
- Indexing 1 hour of audio takes ~6 seconds locally.

**Decision:**
Propose moving search to the client. This aligns with the "Offline First" goal (alongside IndexedDB proposal) and significantly improves UX (instant search).

**Learning:**
Client-side ML models (WASM/ONNX) are now mature enough to replace cloud APIs for specific tasks like embedding generation, offering superior privacy and zero marginal cost.

**Resources:**
- https://huggingface.co/docs/transformers.js/index
