## 🔬 Researcher: Upgrading Waveform Component with wavesurfer.js v7

### 🎯 Executive Summary
This proposal recommends replacing our custom canvas-based waveform implementation with `wavesurfer.js` v7. By utilizing its streaming `media` option instead of full PCM decoding, we can completely eliminate the Out of Memory (OOM) crashes currently occurring with long audio files while adding rich, interactive waveform visualizations.

### 💡 Problem Statement
**Current situation:**
Our current `Waveform` component (`src/components/audio/waveform.tsx`) manually decodes audio using `AudioContext.decodeAudioData()`. This approach attempts to load the entire audio file into memory as uncompressed PCM data before it can be rendered. For large podcasts (e.g., 2+ hours), this causes browser Out of Memory (OOM) crashes or severely degraded performance.

We currently have a partial workaround that attempts to infer a waveform from the transcription segments if the file is longer than 10 minutes, but this is merely a visualization hack and doesn't represent the actual audio data accurately. Furthermore, the custom implementation lacks advanced interactive features like region selection and smooth zooming.

**User impact:**
Users uploading long podcast episodes (the primary use case of the application) frequently encounter complete browser tab crashes or unresponsive UI during the waveform generation phase.

**Example scenario:**
A user uploads a 3-hour MP3 file. The `AudioContext` attempts to decode this into a massive float32 array. The browser tab exceeds its memory limit and crashes with an "Aw, Snap!" error before the user can even begin reviewing highlights.

### 🚀 Proposed Solution
**What:**
Replace the custom canvas implementation in `src/components/audio/waveform.tsx` with `wavesurfer.js` v7.

**How it works:**
We will integrate `wavesurfer.js` v7, specifically using its `media` configuration option tied to an external HTML5 `<audio>` element.
Instead of downloading and decoding the entire file at once, this configuration streams the audio dynamically.
We will also integrate the `RegionsPlugin` to display the generated highlights visually on the waveform.

**Why this approach:**
`wavesurfer.js` is the industry standard for web audio visualization. Version 7 significantly improved performance and bundle size. The streaming `media` approach bypasses the Web Audio API buffer limitations entirely, solving our core OOM issue. Using the `RegionsPlugin` simplifies our highlight rendering logic, allowing us to remove custom canvas drawing code.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** wavesurfer.js v7
- **Maturity:** Stable (v7 released recently, modern architecture)
- **Adoption:** High (Used by major audio platforms)
- **Community:** 9.5k+ GitHub stars, very active
- **License:** BSD-3-Clause
- **Bundle size:** ~20kb minified/gzipped (v7 is much lighter than previous versions)

**Competitive Analysis:**
Most modern podcast tools (Descript, Riverside) use streaming waveform rendering rather than full in-memory decoding to handle long-form content.

**Best Practices:**
For files > 5 minutes, streaming visualization is the recommended pattern. Full PCM decoding should be reserved for short samples where precise sample-level manipulation is required.

### 🧪 Proof of Concept

**Implementation:**
A standalone React component POC has been created demonstrating the proposed approach.
Check `research/pocs/wavesurfer-poc.html`.

It initializes WaveSurfer with a hidden `<audio>` element, avoiding `decodeAudioData`, and uses `RegionsPlugin` to render mock highlights.

### 📈 Value Proposition

**Benefits:**
- ✅ Eliminates browser OOM crashes for long audio files (2+ hours).
- ✅ Drastically faster time-to-interactive for the waveform visualization.
- ✅ Removes complex, error-prone custom canvas rendering code.
- ✅ Provides a foundation for future features (zooming, manual region selection).

**User stories:**
- As a podcast editor, I can upload a 4-hour episode and immediately see the waveform without my browser crashing.
- As a user reviewing highlights, I can clearly see and interact with the highlighted regions on a professional-grade waveform.

### ⚖️ Trade-offs

**Pros:**
- ✅ Solves critical stability issue (OOM crashes).
- ✅ Better visual quality and interactivity than the custom canvas.
- ✅ Simplifies our codebase by offloading rendering to a dedicated library.

**Cons:**
- ❌ Adds a new third-party dependency.
- ❌ Initial waveform calculation for very long files might still take a few seconds (though it won't crash).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Server-side Audiowaveform | Pre-rendered, extremely fast client | Requires backend infrastructure changes, complex deployment | Not chosen because we want to maintain the current serverless/microservice architecture without adding a dedicated audio processing backend just for visualization. |
| Optimize custom canvas | No new dependencies | Still fundamentally limited by `decodeAudioData` memory constraints | Not chosen because the underlying Web Audio API limitation cannot be fully bypassed without switching to a streaming architecture. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 day)
- [ ] Install `wavesurfer.js` v7 as a dependency.
- [ ] Create a new `WaveSurferPlayer` component mirroring the `Waveform` props.

**Phase 2: Core Feature** (estimated: 1 day)
- [ ] Implement the `media` streaming configuration to fix OOM issues.
- [ ] Integrate `RegionsPlugin` to map our `GeneratedHighlight` objects to visual regions.
- [ ] Add playback and seeking controls syncing with our global player state.

**Phase 3: Polish & Testing** (estimated: 1 day)
- [ ] Ensure dark mode compatibility.
- [ ] Replace the custom `Waveform` usage in `src/app/page.tsx`.
- [ ] Test with a >2 hour audio file to verify OOM resolution.

**Total estimated effort:** 3 developer-days

**Dependencies:**
- `wavesurfer.js` (^7.0.0)

**Risks:**
- ⚠️ **Syncing state:** Ensuring `wavesurfer` playback state stays perfectly in sync with our custom `AudioPlayer` if we keep them separate.
  - **Mitigation:** Consider using WaveSurfer as the primary audio controller, entirely replacing the hidden `<audio>` element in our `AudioPlayer`.

### 📚 Resources

**Documentation:**
- [WaveSurfer v7 Documentation](https://wavesurfer.xyz/docs/)
- [WaveSurfer Regions Plugin](https://wavesurfer.xyz/docs/classes/plugins_regions.default)

**Community:**
- [GitHub Repository](https://github.com/katspaugh/wavesurfer.js)

### 🎬 Next Steps

**If approved:**
1. Install the dependency.
2. Begin replacing the `Waveform` component in an isolated branch.
3. Test with extreme file sizes (4+ hours).

### 💬 Discussion Points
- Should we completely replace our custom `AudioPlayer` component with WaveSurfer's built-in playback controls, or keep them separate and sync the state?