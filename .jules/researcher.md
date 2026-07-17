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

## 2026-02-24 - Smart Silence Removal Research

**Research Topic:** Server-side silence detection and removal using FFmpeg

**Finding:**
FFmpeg's `silencedetect` filter works reliably for identifying silence intervals based on decibel threshold, superior to transcript-based gaps.
Combining `silencedetect` output (parsed from stderr) with `atrim` and `concat` filters allows for seamless automated editing.
POC confirmed this works robustly with generated test audio.

**Decision:**
Propose implementing `/detect-silence` and `/remove-silence` endpoints in `ffmpeg-service`.
This offloads processing from the client and ensures A/V sync.

**Learning:**
Parsing FFmpeg's `stderr` for `silencedetect` is straightforward and more reliable than trying to map silence from text timestamps, especially for non-speech segments.

**Resources:**
- https://ffmpeg.org/ffmpeg-filters.html#silencedetect
- research/proposals/2026-02-24-smart-silence-removal.md

## 2026-02-24 - Server-Side Subtitle Burn-In Research

**Research Topic:** Hardcoding subtitles into exported video clips using FFmpeg

**Finding:**
It is possible to automatically "burn-in" subtitles to video exports using FFmpeg's `subtitles` filter (libass). This requires re-encoding the video stream (`-c:v libx264`), which is significantly slower than our current stream copy (`-c copy`) approach used for simple cuts.

**Decision:**
Propose adding a "Burn Subtitles" feature to the `ffmpeg-service` and frontend.
While slower and more CPU intensive, it provides massive user value by eliminating the need for external editors (like CapCut) before posting to social media.

**Learning:**
When using the `subtitles` filter, you must escape the path to the SRT file (`replace(/\\/g, '/').replace(/:/g, '\\:')`). Additionally, `force_style` must be used to ensure the text looks modern (fonts, borders, shadows) as default FFmpeg subtitles are often unstyled and small.

**Resources:**
- https://ffmpeg.org/ffmpeg-filters.html#subtitles-1
- research/proposals/2026-02-24-subtitle-burn-in.md
