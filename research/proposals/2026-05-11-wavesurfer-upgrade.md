## 🔬 Researcher: Advanced Audio Visualization with Wavesurfer.js

### 🎯 Executive Summary
Propose replacing the custom canvas-based audio waveform implementation with `wavesurfer.js`. This upgrade provides robust zooming capabilities, native audio region highlights, and significantly better performance for long audio files, matching professional editing tool standards.

### 💡 Problem Statement
**Current situation:**
The current waveform implementation (`src/components/audio/waveform.tsx`) is a custom-built canvas solution. It manually decodes the full audio file into memory, downsamples it to a fixed resolution (200 bars), and completely lacks zooming functionality.

**User impact:**
- **Navigation:** Users cannot zoom in to make precise edits or cuts.
- **Performance:** For long podcasts (1-4 hours), decoding the full file into a single array is extremely memory-intensive and can crash the browser tab.
- **Accuracy:** The fixed 200-bar resolution means a 1-hour audio file shows 18 seconds per bar, making visual gap detection impossible.

**Example scenario:**
A user is editing a 2-hour interview. They want to clip out a specific 5-second silence. Because the waveform cannot zoom, the 5-second silence is visually represented by a fraction of a single pixel, making it impossible to click accurately.

### 🚀 Proposed Solution
**What:**
Integrate `wavesurfer.js` as the core audio visualization and playback engine, replacing both the custom `Waveform` component and potentially simplifying the `AudioPlayer`.

**How it works:**
- Use `WaveSurfer.create()` attached to a container ref.
- Utilize the `RegionsPlugin` to visually represent the generated highlights (currently drawn manually on canvas).
- Implement a zoom slider tied to the `ws.zoom(minPxPerSec)` API.

**Why this approach:**
- **Industry Standard:** It is the de-facto library for web-based audio waveforms.
- **Performance:** It handles chunked loading and can generate peaks without decoding the entire audio file into RAM at once (using MediaElement backend).
- **Features:** Native support for zooming, interactive regions (drag to resize highlights), and minimaps.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `wavesurfer.js` v7+
- **Maturity:** Very Stable (10+ years active development)
- **Adoption:** Used by countless audio tools, massive GitHub following.
- **Community:** 10k+ GitHub stars, ~500k weekly npm downloads.
- **License:** BSD-3-Clause
- **Bundle size:** ~35kb (minified + gzipped)

**Competitive Analysis:**
- **Descript:** Uses advanced WebGL/Canvas with deep zoom.
- **Riverside.fm:** Uses zoomable waveforms for multi-track editing.
- **Our App:** Fixed-width static canvas.

**Best Practices:**
- For very large files (e.g., > 100MB), pre-calculate peaks on the server (via `audiowaveform` CLI) and pass them to wavesurfer to avoid client-side decoding entirely.

### 🧪 Proof of Concept

**Implementation:**
See `research/pocs/wavesurfer-poc.tsx` for a functional React component demonstrating the core features.

```tsx
// Core initialization snippet
const ws = WaveSurfer.create({
  container: containerRef.current,
  waveColor: 'rgba(203, 213, 225, 0.8)',
  progressColor: 'rgba(59, 130, 246, 0.8)',
  minPxPerSec: zoomLevel, // Controls zoom
  plugins: [RegionsPlugin.create()]
});

// Adding a highlight region
ws.registerPlugin(RegionsPlugin.create()).addRegion({
  start: 10,
  end: 25,
  color: 'rgba(139, 92, 246, 0.3)'
});
```

**Demo:**
The POC renders an interactive waveform with playback controls and a functional zoom slider.

**Performance:**
- **Before:** O(N) memory allocation where N is the uncompressed audio buffer size. Fixed visual resolution.
- **After:** Optimized memory usage (especially if we implement pre-computed peaks). Infinite zoom resolution up to the sample rate.
- **Impact:** Massive UX improvement for precision editing.

### 📈 Value Proposition

**Benefits:**
- ✅ **Precision Editing:** Zooming allows frame-accurate cuts and highlight adjustments.
- ✅ **Stability:** Prevents browser OOM (Out of Memory) crashes on large files.
- ✅ **Feature Velocity:** We get regions, minimap, and spectrogram features "for free" via plugins.

**User stories:**
- As an editor, I can zoom into the waveform so that I can precisely identify where a sentence starts and ends.
- As a power user, I can drag the edges of a highlighted region on the waveform to fine-tune the clip boundaries.

### ⚖️ Trade-offs

**Pros:**
- ✅ Solves the zoom problem instantly.
- ✅ Battle-tested library.

**Cons:**
- ❌ **Bundle Size:** Adds ~35kb to the application bundle.
- ❌ **React Integration:** Requires careful `useEffect` management since it mutates the DOM directly outside of React's lifecycle.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Improve Custom Canvas | Zero new dependencies | Re-inventing the wheel, complex math for zoom | Not chosen because of maintenance burden |
| Peaks.js (BBC) | Great for very long audio | Harder to style, heavier API | Not chosen (wavesurfer is more modern) |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 day)
- [ ] Install `wavesurfer.js`.
- [ ] Create a new `ZoomableWaveform` component.
- [ ] Implement basic playback, sync with our existing `TaskQueueState` if needed.

**Phase 2: Core Feature (Regions & Zoom)** (estimated: 2 days)
- [ ] Integrate `RegionsPlugin` to display existing highlights.
- [ ] Add Zoom controls UI (slider +/-, mouse wheel).
- [ ] Sync the new waveform with the existing `AudioPlayer` state (or replace it).

**Phase 3: Polish & Testing** (estimated: 1 day)
- [ ] Ensure dark mode colors adapt correctly.
- [ ] Handle cleanup to prevent memory leaks on unmount.
- [ ] Implement responsive resizing.

**Total estimated effort:** 4 developer-days

**Dependencies:**
- `wavesurfer.js`

**Risks:**
- ⚠️ **React Strict Mode:** Double initialization in dev mode.
  - *Mitigation:* Ensure `ws.destroy()` is strictly called in `useEffect` cleanup.

### 📚 Resources

**Documentation:**
- [Wavesurfer.js Official Docs](https://wavesurfer.xyz/docs/)
- [Regions Plugin Docs](https://wavesurfer.xyz/docs/classes/plugins_regions.RegionsPlugin)

**Examples:**
- [React Integration Example](https://wavesurfer.xyz/examples/?react.js)

### 🎬 Next Steps

**If approved:**
1. Review the `wavesurfer-poc.tsx` implementation.
2. Discuss whether to keep the existing `AudioPlayer` or let Wavesurfer handle all playback logic.
3. Begin Phase 1 implementation.

### 💬 Discussion Points
- Should we allow users to drag/resize the highlight regions directly on the waveform, or keep them read-only for now?
- For files over 2 hours, should we implement server-side peak generation to speed up the initial rendering?
