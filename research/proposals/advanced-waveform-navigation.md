## 🔬 Researcher: Advanced Waveform Navigation with Wavesurfer.js

### 🎯 Executive Summary
I propose upgrading the current `Waveform` component to use **wavesurfer.js**. While the current implementation provides a high-level overview, it lacks **zoom capabilities** and **segment selection interactions** required for precise editing. Switching to `wavesurfer.js` enables professional-grade audio navigation, including drag-to-select regions for highlight creation and seamless zooming.

### 💡 Problem Statement
**Current situation:**
The existing `src/components/audio/waveform.tsx` uses a custom Canvas implementation that:
1.  **Low Resolution:** Downsamples the entire audio to a fixed 200 bars. This makes it impossible to distinguish between a 1-second pause and a 5-second silence in a 1-hour podcast.
2.  **Performance Risk:** It uses `AudioContext.decodeAudioData` on the full file at once. For a 2-hour podcast, this decodes to ~1.2GB of PCM data in RAM, likely causing browser crashes on low-end devices.
3.  **No Zoom:** Users cannot "zoom in" to find precise cut points.

**User impact:**
Users cannot perform fine-grained editing (e.g., "start highlight exactly when he says 'Hello'"). They are limited to rough approximations.

### 🚀 Proposed Solution
**What:**
Refactor `Waveform` to use `wavesurfer.js` (v7) with the `RegionsPlugin` and `ZoomPlugin`.

**How it works:**
- **Zooming:** `wavesurfer.js` handles scrollable canvases natively.
- **Regions:** Use `RegionsPlugin` to visualize Highlights as interactive, draggable overlays instead of static colored rectangles.
- **Performance:** `wavesurfer.js` supports decoding in chunks (MediaElement backend) or using pre-generated JSON peaks (server-side), avoiding the OOM crash.

**Why this approach:**
- **Standardization:** Stop maintaining custom low-level canvas code.
- **Features:** Zoom, Regions, Timeline are built-in.
- **Performance:** Better handling of large files.

### 📊 Research Findings

**Comparison:**

| Feature | Current Custom Component | Wavesurfer.js |
|---------|--------------------------|---------------|
| **Resolution** | Fixed (200 bars) | Infinite (Zoomable) |
| **Editing** | Static (View only) | Interactive (Drag regions) |
| **Memory** | High (Full decode) | Flexible (Peaks/MediaElement) |
| **Maintenance**| High (Custom Canvas) | Low (Library) |

**Library Analysis:**
- **Library:** `wavesurfer.js`
- **Plugins:** `RegionsPlugin` (for highlights), `TimelinePlugin` (for time axis).
- **Bundle Impact:** ~30KB (worth it for the core feature of the app).

### 🧪 Proof of Concept

I verified that `wavesurfer.js` can be initialized in a Next.js environment.

**Proposed Implementation Strategy:**

```tsx
// src/components/audio/waveform.tsx (Refactored)
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

// Initialize with plugins
const ws = WaveSurfer.create({
  container: containerRef.current,
  url: audioUrl,
  plugins: [
    RegionsPlugin.create(), // Enable draggable regions
  ]
});

// Add Highlights as Regions
highlights.forEach(h => {
  ws.plugins.regions.add({
    start: h.startTime,
    end: h.endTime,
    content: h.title,
    color: getHighlightColor(h.id),
    drag: false, // Set to true to allow editing
    resize: false
  });
});
```

### 📈 Value Proposition

**Benefits:**
- ✅ **Precision Editing:** Zoom in to seeing individual words/breaths.
- ✅ **Interactive Highlights:** Users could drag highlight boundaries to adjust them (new feature possibility).
- ✅ **Stability:** Prevent browser crashes on long files by switching to MediaElement backend or Peaks.

**User stories:**
- As a **Creator**, I want to **zoom in** on the waveform so I can cut out a specific cough or pause.
- As a **User**, I want to **click and drag** on the waveform to create a new highlight.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massive jump in functionality (Zoom/Edit).
- ✅ Offloads complexity to a maintained library.

**Cons:**
- ❌ **Migration Effort:** Need to rewrite the component.
- ❌ **Dependencies:** Adds a dependency.

### 🛠️ Implementation Plan

**Phase 1: Replacement** (estimated: 2 days)
- [ ] Install `wavesurfer.js`.
- [ ] Re-implement `Waveform` component using `wavesurfer.js`.
- [ ] Map existing `highlights` prop to `RegionsPlugin`.

**Phase 2: Interaction** (estimated: 2 days)
- [ ] Add Zoom slider/scroll wheel support.
- [ ] Implement "Click to seek" (native in library).

**Phase 3: Performance (Server-side)** (estimated: 3 days)
- [ ] Update backend to generate `.json` peaks using `audiowaveform`.
- [ ] Update frontend to fetch peaks instead of decoding audio.

**Total estimated effort:** 1 week

### 🎬 Next Steps

**If approved:**
1.  Approve dependency `wavesurfer.js`.
2.  Begin Phase 1 (Component Replacement).
