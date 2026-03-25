## 🔬 Researcher: Migrate Waveform Canvas to wavesurfer.js

### 🎯 Executive Summary
Replace the custom HTML canvas-based audio waveform implementation with `wavesurfer.js` utilizing the `MediaElement` backend. This migration significantly improves memory management, preventing Out of Memory (OOM) crashes on large files while providing robust zooming and region visualization capabilities out-of-the-box.

### 💡 Problem Statement
**Current situation:**
The current `Waveform` component manually decodes full audio data into memory using `AudioContext.decodeAudioData` and attempts to render it on a custom HTML canvas. While there is a fallback to using transcription segments for files > 10 minutes, the manual decoding approach is highly memory-intensive.

**User impact:**
Users uploading large, long-duration podcasts or video files experience severe browser lag and frequent "Aw, Snap!" (Out of Memory) crashes when the browser attempts to hold massive PCM data arrays in memory to draw the waveform.

**Example scenario:**
A user uploads a 2-hour MP3 podcast for highlight extraction. The browser tab crashes during the "Gerando waveform..." phase before they can interact with the player.

### 🚀 Proposed Solution
**What:**
Migrate the `Waveform.tsx` component to use the established `wavesurfer.js` library, specifically configuring it with `backend: 'MediaElement'` and leveraging its `RegionsPlugin` for highlight rendering.

**How it works:**
Instead of `decodeAudioData` fetching and holding the entire uncompressed audio buffer, `wavesurfer.js` with the `MediaElement` backend uses HTML5 `<audio>` element features to efficiently fetch and render peaks without decoding the full file into memory. Highlight regions are drawn automatically via the plugin.

**Why this approach:**
`wavesurfer.js` is the industry standard for web-based waveforms. Utilizing the `MediaElement` backend directly addresses the OOM crashes. Offloading the drawing logic to the library removes the complex, error-prone manual canvas downsampling and drawing loops currently in our codebase.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** wavesurfer.js (v7+)
- **Maturity:** Highly Stable
- **Adoption:** Extensively used in web audio applications.
- **Community:** 10k+ GitHub stars, very active.
- **License:** BSD-3-Clause
- **Bundle size:** ~30kb (minified/gzipped)

**Competitive Analysis:**
Many modern audio/video editing web apps (e.g., Descript, Riverside) utilize chunked rendering or library-backed peak fetching to display waveforms for multi-hour files smoothly.

**Best Practices:**
For large audio files in the browser, it is a best practice to avoid `AudioContext.decodeAudioData` on the entire file and instead use streaming backends or pre-calculated peak data.

### 🧪 Proof of Concept

**Implementation:**
The proof of concept can be found at `research/pocs/wavesurfer/Waveform.tsx`.
It integrates `WaveSurfer.create()` with the crucial `backend: 'MediaElement'` configuration and the `RegionsPlugin`.

**Performance:**
- Before: Frequent OOM crashes on files > 1 hour; complex fallback logic required.
- After: Smooth rendering of files > 2 hours without massive memory spikes.

### 📈 Value Proposition

**Benefits:**
- ✅ Prevents browser OOM crashes, directly solving a major reliability issue.
- ✅ Removes complex manual canvas drawing and downsampling code, simplifying maintenance.
- ✅ Provides built-in zooming (`minPxPerSec`) and interaction handling.

**User stories:**
- As a podcaster, I can upload a 3-hour episode without my browser crashing, so that I can generate and review highlights.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massively improved memory efficiency for long files.
- ✅ Less custom rendering code to maintain.
- ✅ Better interaction accuracy (clicking, seeking).

**Cons:**
- ❌ Adds a new third-party dependency (`wavesurfer.js`).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Refactor custom Canvas (chunking) | No new dependencies | Very complex to implement correctly; still risks memory spikes. | Not chosen because `wavesurfer.js` already solves this elegantly. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 0.5 days)
- [x] Install `wavesurfer.js` dependency.
- [x] Create POC implementation.

**Phase 2: Core Feature** (estimated: 1 day)
- [ ] Replace `src/components/audio/waveform.tsx` with the POC code.
- [ ] Ensure all existing props (highlights mapping, colors, `onSeek`) map correctly to `wavesurfer.js` events and regions.
- [ ] Implement responsive resizing logic using `wavesurfer.on('resize', ...)` or ResizeObserver.

**Phase 3: Polish & Testing** (estimated: 0.5 days)
- [ ] Test with a long (> 1hr) audio file to confirm memory stability.
- [ ] Verify accessibility attributes (`role="slider"`, `aria-valuenow`, keyboard navigation) are maintained.

**Total estimated effort:** 2 developer-days

**Dependencies:**
- `wavesurfer.js`

**Risks:**
- ⚠️ Custom styling of regions might differ slightly from the current canvas implementation. - Mitigation: Spend time tweaking `RegionsPlugin` CSS or color parameters to match existing design.

### 📚 Resources

**Documentation:**
- [wavesurfer.js Documentation](https://wavesurfer.xyz/docs/)
- [wavesurfer.js MediaElement Backend](https://wavesurfer.xyz/docs/options#backend)

### 🎬 Next Steps

**If approved:**
1. Review and test the POC.
2. Proceed with Phase 2 implementation.
