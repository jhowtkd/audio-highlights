## 🔬 Researcher: WaveSurfer.js Migration

### 🎯 Executive Summary
Replace the custom canvas-based audio waveform rendering with `wavesurfer.js`. This resolves significant performance and memory bottlenecks associated with decoding large audio files entirely in the browser, while simultaneously adding advanced features like zooming and regions support.

### 💡 Problem Statement
**Current situation:**
The current `Waveform` component (`src/components/audio/waveform.tsx`) manually fetches the entire audio file, decodes it fully into an `AudioBuffer` using `AudioContext.decodeAudioData()`, and renders it onto an HTML canvas.

**User impact:**
- **Out of Memory (OOM) Errors:** Browsers crash (especially Chrome) when trying to decode large podcast files (e.g., >1 hour MP3s) because `decodeAudioData` requires a single massive contiguous block of PCM array memory.
- **Main Thread Freezing:** The custom downsampling loop freezes the main thread during waveform generation.
- **Missing Features:** The current implementation lacks essential navigation features like zooming or easily interactive highlight regions.

**Example scenario:**
A user uploads a 2-hour podcast. The browser attempts to decode the entire file into a massive floating-point array, causing the tab to crash with an "Aw, Snap!" Out of Memory error.

### 🚀 Proposed Solution
**What:**
Migrate the `Waveform` component from the custom canvas implementation to `wavesurfer.js` (v7+).

**How it works:**
- We will configure `wavesurfer.js` to use the `MediaElement` backend instead of Web Audio. This ensures the browser only requests and processes audio in chunks, preventing OOM errors.
- We will utilize `wavesurfer.js/dist/plugins/regions.esm.js` to render the `GeneratedHighlight` objects directly onto the waveform.

**Why this approach:**
- `wavesurfer.js` v7 is highly optimized, small, and stable.
- The `MediaElement` backend is specifically designed to handle long audio files without loading them entirely into memory.
- It provides a built-in zoom API and region plugin, significantly reducing the custom code we need to maintain.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `wavesurfer.js` (v7.x)
- **Maturity:** Stable, battle-tested standard for web audio visualization.
- **Adoption:** Used by countless audio applications, highly popular.
- **Community:** 9.5k+ GitHub stars, excellent v7 documentation.
- **License:** BSD-3-Clause

### 🧪 Proof of Concept

**Implementation:**
The POC is available at `research/pocs/wavesurfer/Waveform.tsx`.
It successfully demonstrates using the `MediaElement` backend and the Regions plugin to render highlights without OOM issues.

### 📈 Value Proposition

**Benefits:**
- ✅ Eliminates browser Out of Memory (OOM) crashes on large files.
- ✅ Removes main-thread blocking during waveform generation.
- ✅ Lays groundwork for future zoom and advanced navigation features.

### ⚖️ Trade-offs

**Pros:**
- ✅ Solves critical stability issues for core use case (long podcasts).
- ✅ Drastically reduces custom visualization code maintenance.

**Cons:**
- ❌ Adds a new dependency to the project.

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 day)
- [ ] Install `wavesurfer.js`.
- [ ] Implement `WaveSurferWaveform` component mapping to the existing props interface.

**Phase 2: Core Feature** (estimated: 1 day)
- [ ] Replace custom canvas `Waveform` component in `page.tsx` with new `WaveSurferWaveform`.
- [ ] Ensure `onSeek`, region rendering, and time synchronization match the existing UX.

**Total estimated effort:** 2 developer-days

### 📚 Resources

**Documentation:**
- https://wavesurfer.xyz/docs/

### 🎬 Next Steps

**If approved:**
1. Execute the implementation plan.
