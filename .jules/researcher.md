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

## 2025-02-18 - Client-Side Semantic Search Research

**Research Topic:** Client-Side Vector Search vs API Search

**Finding:**
Current `api/search` uses OpenAI's API, which is slow (~1-3s), costly, and less private.
Tested `@xenova/transformers` with `Xenova/all-MiniLM-L6-v2` (quantized) in a local POC.
- **Inference time:** <10ms per query.
- **Model load:** ~2s.
- **Accuracy:** Excellent semantic matching (e.g., "money" -> "economic impact").

**Decision:**
Propose replacing server-side search with client-side embedding generation using Transformers.js.
Benefits: Zero marginal cost, instant search-as-you-type, privacy-first, offline capable.

**Learning:**
WebAssembly-powered ML models are now mature enough for real-time text features in the browser, offering a superior UX compared to round-trip API calls for this use case.

**Resources:**
- https://huggingface.co/docs/transformers.js
- research/2025-02-18-client-side-semantic-search.md

## 2026-02-20 - Virtualized List Rendering Research

**Research Topic:** Optimization of large transcript rendering using virtualization.

**Finding:** Evaluated `react-virtuoso` for rendering transcript segments.
-   POC confirmed massive DOM reduction (3000 -> 20 nodes for 1000 items).
-   `react-virtuoso` handles variable heights and "stick to bottom" behavior out of the box, which is critical for the "auto-scroll during playback" feature.
-   Native `Ctrl+F` breaks because items are unmounted.

**Decision:** Proposed `react-virtuoso`.
-   Performance gains (60fps scrolling) outweigh the `Ctrl+F` limitation (which can be mitigated by our custom search).
-   Complexity of manual "chunking" code can be removed.

**Learning:** When creating POCs that require dependencies not yet in the project:
1.  Isolate code in `research/pocs/`.
2.  Add `research` to `tsconfig.json` exclude list to prevent build errors when dependency is removed.
3.  Include screenshots in `public/research/` to document the POC state after code is "cleaned".

**Resources:**
-   https://virtuoso.dev/

## 2025-02-28 - Automated YouTube Chapters Research

**Research Topic:** Generating YouTube Chapters and Show Notes automatically from existing transcripts.
**Finding:** Evaluated using the existing OpenAI integration to summarize the transcript into formatted YouTube Chapters (timestamps + titles) and SEO Show Notes. Tested with `gpt-4o-mini`. The model can reliably output a strict JSON array of `{time: "00:00", title: "..."}` when provided with timestamped transcriptions.
**Decision:** Proposed adding an automated Show Notes generation feature. It requires zero new dependencies, has a very low API cost, and solves a major pain point (manual formatting) for creators who publish full episodes to YouTube or Spotify.
**Learning:** For YouTube chapters, the platform strictly requires the first chapter to start at exactly `00:00`. It's critical to enforce this rule in the LLM system prompt and validate it on the backend, as the LLM might occasionally start the first chapter at the first spoken word (e.g., `00:05`).
**Resources:**
- https://support.google.com/youtube/answer/9884579?hl=en (YouTube Chapter Requirements)
