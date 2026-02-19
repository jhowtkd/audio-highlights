## 🔬 Researcher: Advanced Waveform Navigation with Wavesurfer.js

### 🎯 Executive Summary
I propose replacing the current custom canvas-based waveform component with **wavesurfer.js v7**. The current implementation lacks critical editing features like zooming and precise region selection, and suffers from performance issues with large files due to full client-side decoding. Wavesurfer.js provides a robust, battle-tested solution for professional audio visualization and interaction.

### 💡 Problem Statement
**Current situation:**
The existing `Waveform` component (`src/components/audio/waveform.tsx`) uses a custom Canvas implementation that:
1.  **Low Resolution:** Downsamples audio to a fixed 200 bars, making precise editing impossible.
2.  **Performance Risk:** Decodes the entire audio file at once using `AudioContext.decodeAudioData`, which can cause browser crashes (OOM) for long podcasts (>1 hour).
3.  **No Zoom:** Users cannot zoom in to find exact cut points (e.g., removing a cough or silence).
4.  **Static Visualization:** Highlights are just colored rectangles; users cannot drag or resize them to adjust boundaries.

**User impact:**
Editors cannot perform fine-grained cuts or adjustments. They are limited to rough approximations, reducing the quality of generated clips.

### 🚀 Proposed Solution
**What:**
Integrate **wavesurfer.js (v7)** with `RegionsPlugin`, `TimelinePlugin`, and `ZoomPlugin`.

**How it works:**
-   **Core:** `wavesurfer.js` handles audio decoding (using Web Audio or MediaElement) and rendering.
-   **Regions:** `RegionsPlugin` visualizes highlights as draggable, resizable overlays.
-   **Timeline:** `TimelinePlugin` adds a time ruler for context.
-   **Zoom:** Native zooming capabilities allow users to inspect audio at the millisecond level.

**Why this approach:**
-   **Standardization:** Adopts the industry-standard library for web audio.
-   **Features:** Out-of-the-box support for Zoom, Regions, Timeline, and Spectrograms.
-   **Performance:** Supports "Peaks" data (pre-calculated on server) to avoid client-side decoding of large files.

### 📊 Research Findings

**Technology Analysis:**
-   **Library:** `wavesurfer.js` v7.12.1
-   **Maturity:** Stable, widely used (7k+ stars on GitHub).
-   **License:** BSD-3-Clause (Compatible).
-   **Bundle Size:** ~35KB (gzipped).

**Competitive Analysis:**
-   **Descript:** Uses similar waveform visualization with text sync.
-   **Adobe Audition (Web):** Uses detailed waveforms with spectral view.
-   **Current App:** Uses static bars (SoundCloud style but non-interactive).

### 🧪 Proof of Concept

I have implemented a working Proof of Concept (POC) available at `/poc-waveform`.

**Implementation:**
The POC component `src/components/audio/waveform-poc.tsx` demonstrates:
1.  **Initialization:** Loading audio from a URL.
2.  **Plugins:** `RegionsPlugin` for highlights, `TimelinePlugin` for time axis.
3.  **Interactivity:**
    -   **Zoom:** Slider controls `pxPerSec` from 10 to 200.
    -   **Regions:** "Add Region" button adds a draggable highlight.
    -   **Playback:** Play/Pause synchronization.

**Code Snippet:**
```tsx
const ws = WaveSurfer.create({
  container: containerRef.current,
  url: audioUrl,
  plugins: [
    RegionsPlugin.create(),
    TimelinePlugin.create({ container: '#timeline' }),
  ],
});
```

**Verification:**
A Playwright script (`verification/verify_waveform.py`) confirmed that the waveform renders correctly and the plugins are active.

### 📈 Value Proposition

**Benefits:**
-   ✅ **Precision Editing:** Users can zoom in to see silence gaps and transient noises.
-   ✅ **Interactive Highlights:** Users can adjust highlight start/end times by dragging handles.
-   ✅ **Scalability:** Pathway to server-side peaks generation for long files.

**User stories:**
-   As a **Creator**, I want to zoom in on a specific sentence to cut out a stutter.
-   As a **Reviewer**, I want to drag the boundaries of an AI-generated highlight to fix a cut-off word.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Massive functionality upgrade (Zoom, Drag & Drop).
-   ✅ Reduced maintenance of custom canvas code.
-   ✅ Extensible ecosystem (Spectrogram, Envelope, etc.).

**Cons:**
-   ❌ **Bundle Size:** Adds ~35KB to the bundle.
-   ❌ **Migration:** Requires refactoring the existing `Waveform` component and its props (`highlights`, `currentTime`, etc.).

### 🛠️ Implementation Plan

**Phase 1: Foundation (Current Status: POC Complete)**
-   [x] Install `wavesurfer.js`.
-   [x] Create POC to validate integration (`src/app/poc-waveform`).

**Phase 2: Component Replacement (Estimated: 2 days)**
-   [ ] Refactor `src/components/audio/waveform.tsx` to use `wavesurfer.js`.
-   [ ] Map `highlights` prop to `ws.plugins.regions`.
-   [ ] Sync `currentTime` state with global player (or replace global player logic).

**Phase 3: Advanced Features (Estimated: 3 days)**
-   [ ] Implement "Click to Seek" on transcript syncing.
-   [ ] Add "Zoom" controls to the main UI.
-   [ ] (Optional) Implement Server-side Peaks generation for >1h files.

### 📚 Resources

-   [wavesurfer.js Documentation](https://wavesurfer.xyz/)
-   [Regions Plugin Docs](https://wavesurfer.xyz/docs/modules/plugins/regions)

### 🎬 Next Steps

1.  Review and approve this proposal.
2.  Merge the POC code as a reference.
3.  Schedule the refactoring of `Waveform` component.
