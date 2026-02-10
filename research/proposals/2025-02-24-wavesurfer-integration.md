## 🔬 Researcher: Advanced Waveform Navigation with Wavesurfer.js

### 🎯 Executive Summary
I propose replacing the current custom canvas-based `Waveform` component with **wavesurfer.js (v7)**. This upgrade will provide professional-grade audio navigation features, including **zoom capabilities**, **interactive region selection**, and **timeline visualization**, which are critical for precise audio editing and highlight selection.

### 💡 Problem Statement
**Current situation:**
The existing `src/components/audio/waveform.tsx` implementation has several limitations:
1.  **Low Resolution:** It uses a fixed sampling rate (200 bars), making it impossible to perform fine-grained editing.
2.  **Performance Risk:** It attempts to decode the entire audio file into memory (`AudioContext.decodeAudioData`), which can cause browser crashes (OOM) with large podcast files.
3.  **Lack of Interactivity:** It is a static visualization; users cannot zoom in to find precise cut points or drag to adjust highlight boundaries.

**User impact:**
Users are limited to rough approximations when selecting highlights. They cannot visually identify silence or specific speech patterns, leading to less precise edits.

### 🚀 Proposed Solution
**What:**
Integrate `wavesurfer.js` v7 with `RegionsPlugin` and `TimelinePlugin`.

**How it works:**
-   **Core:** Use `wavesurfer.js` for high-performance waveform rendering.
-   **Zoom:** Enable `minPxPerSec` based zooming to allow users to inspect audio at the millisecond level.
-   **Regions:** Use `RegionsPlugin` to visualize highlights as interactive, draggable, and resizable overlays.
-   **Timeline:** Use `TimelinePlugin` to display a precise time axis that scales with zoom.

**Why this approach:**
-   **Industry Standard:** `wavesurfer.js` is the most mature and widely used library for this purpose.
-   **Performance:** It supports streaming decoding and pre-decoded peaks, handling large files efficiently.
-   **Feature Rich:** Built-in support for regions and zooming saves weeks of custom development.

### 📊 Research Findings

**Technology Analysis:**
-   **Library:** `wavesurfer.js` (v7.12.1)
-   **Maturity:** Highly mature, active maintenance.
-   **License:** BSD-3-Clause (compatible).
-   **Bundle size:** ~30KB (minified + gzipped).

**Competitive Analysis:**
-   **Descript:** Uses similar waveform visualization with zoom and text alignment.
-   **Audacity/Adobe Audition:** Standard waveform interactions (zoom, select) are expected by power users.

### 🧪 Proof of Concept

**Implementation:**
A POC has been implemented in `src/app/research-poc/wavesurfer/page.tsx`.

**Demo:**
![Wavesurfer POC](/research/wavesurfer-poc.png)

It demonstrates:
1.  **Zooming:** Smooth zoom using a range slider.
2.  **Regions:** Creating, dragging, and resizing regions (simulating highlights).
3.  **Timeline:** Synchronized time axis.
4.  **Playback:** Synchronized playback with the waveform.

**Code Snippet (POC):**
```tsx
const wavesurfer = WaveSurfer.create({
  container: containerRef.current,
  url: '...',
  minPxPerSec: 100, // Zoom level
  plugins: [
    RegionsPlugin.create(),
    TimelinePlugin.create({ container: timelineRef.current }),
  ],
});
```

### 📈 Value Proposition

**Benefits:**
-   ✅ **Precision:** Users can make frame-perfect edits.
-   ✅ **UX:** Intuitive "drag to create/edit" interaction for highlights.
-   ✅ **Stability:** Better handling of large files via streaming/peaks.

**User stories:**
-   As a content creator, I want to zoom into the waveform to cut out a cough or silence exactly where it starts and ends.
-   As a user, I want to drag the edges of a highlight to adjust its start and end time visually.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Massive functionality upgrade.
-   ✅ Offloads maintenance of complex audio visualization logic.

**Cons:**
-   ❌ **Bundle Size:** Adds ~30KB to the bundle.
-   ❌ **Refactor:** Requires replacing the existing `Waveform` component and adapting the `TranscriptViewer` interaction.

### 🛠️ Implementation Plan

**Phase 1: Foundation (estimated: 2 days)**
-   [ ] Install `wavesurfer.js` (Done in POC).
-   [ ] Create `WaveformVisualizer` component wrapping `wavesurfer.js`.
-   [ ] Implement basic playback control and synchronization with `TranscriptViewer`.

**Phase 2: Regions & Zoom (estimated: 2 days)**
-   [ ] Implement `RegionsPlugin` to render `highlights` prop.
-   [ ] Add Zoom controls to the UI.
-   [ ] specific "Add Highlight" mode where dragging on the waveform creates a new highlight.

**Phase 3: Performance (estimated: 2 days)**
-   [ ] Implement "Peaks" generation on the server (using `audiowaveform` CLI or similar) to allow instant loading of large files without decoding on the client.

**Total estimated effort:** 6 developer-days

### 📚 Resources

**Documentation:**
-   [Wavesurfer.js v7 Docs](https://wavesurfer.xyz/docs/)
-   [Regions Plugin](https://wavesurfer.xyz/docs/modules/plugins_regions)

### 🎬 Next Steps

**If approved:**
1.  Approve the dependency `wavesurfer.js`.
2.  Assign the implementation task.
