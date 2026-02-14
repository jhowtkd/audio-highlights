## 🔬 Researcher: Advanced Waveform Navigation with Wavesurfer.js

### 🎯 Executive Summary
I propose upgrading the current `Waveform` component to use **wavesurfer.js** v7. While the current implementation provides a high-level overview, it lacks **zoom capabilities** and **segment selection interactions** required for precise editing. Switching to `wavesurfer.js` enables professional-grade audio navigation, including drag-to-select regions for highlight creation and seamless zooming, while maintaining performance via MediaElement backend or pre-generated peaks.

### 💡 Problem Statement
**Current situation:**
The existing `src/components/audio/waveform.tsx` uses a custom Canvas implementation that:
1.  **Low Resolution:** Downsamples the entire audio to a fixed 200 bars.
2.  **Performance Risk:** It uses `AudioContext.decodeAudioData` on the full file at once, which can cause OOM crashes for large files.
3.  **No Zoom:** Users cannot "zoom in" to find precise cut points.
4.  **Limited Interaction:** No support for dragging to create or resize highlights.

**User impact:**
Users cannot perform fine-grained editing. They are limited to rough approximations when defining highlight boundaries.

### 🚀 Proposed Solution
**What:**
Refactor `Waveform` to use `wavesurfer.js` (v7) with the `RegionsPlugin` and `ZoomPlugin` (built-in via `minPxPerSec`).

**How it works:**
- **Zooming:** `wavesurfer.js` handles scrollable canvases natively using `minPxPerSec`.
- **Regions:** Use `RegionsPlugin` to visualize Highlights as interactive, draggable overlays.
- **Performance:** Utilize `MediaElement` backend (streaming) or fetch pre-generated `.json` peaks to avoid full client-side decoding.
- **Security:** Update CSP to allow `blob:` in `connect-src` (verified requirement).

**Why this approach:**
- **Standardization:** Leverages a battle-tested library instead of maintaining custom canvas code.
- **Features:** Zoom, Regions, Timeline, and Virtualization are supported.
- **Ecotsystem:** v7 is modular and TypeScript-friendly.

### 📊 Research Findings

**Technology Analysis:**
- **Library:** `wavesurfer.js` (v7.12.1)
- **Maturity:** Stable (v7 is a major rewrite for performance and TS).
- **Adoption:** Industry standard for web audio visualization.
- **License:** BSD-3-Clause (Compatible).
- **Bundle size:** ~30KB (Gzipped).

**Technical Constraints & Fixes:**
1.  **CSP Requirement:** The application's strict Content Security Policy blocked `blob:` URLs for audio workers. I verified that adding `blob:` to `connect-src` in `src/middleware.ts` resolves this.
2.  **Plugin Imports:** v7 plugins are ES modules. Verified import path: `wavesurfer.js/dist/plugins/[plugin].esm.js`.
3.  **React 19 Compatibility:** Verified compatible with React 19 and Next.js 16 (App Router) using `dynamic` import with `{ ssr: false }`.

### 🧪 Proof of Concept

I have implemented a functional POC at `src/app/research-poc/wavesurfer/page.tsx`.

**Features Verified:**
- ✅ Rendering waveform from a dynamically generated WAV Blob (Client-side synthesis).
- ✅ Zooming via `minPxPerSec` parameter.
- ✅ `RegionsPlugin` for creating and dragging highlight regions.
- ✅ `TimelinePlugin` for time axis.
- ✅ Play/Pause integration.

**Implementation:**
```tsx
// src/app/research-poc/wavesurfer/components/wavesurfer-poc.tsx
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

// ... inside useEffect
const ws = WaveSurfer.create({
  container: containerRef.current,
  url: audioUrl,
  minPxPerSec: zoom, // Controls zoom level
});

const wsRegions = ws.registerPlugin(RegionsPlugin.create());
```

**Demo:**
Screenshot available at `verification/wavesurfer_poc.png`.

### 📈 Value Proposition

**Benefits:**
- ✅ **Precision Editing:** Zoom in to see individual phonemes/pauses.
- ✅ **Interactive Highlights:** Users can drag highlight boundaries to adjust them intuitively.
- ✅ **Stability:** Prevent browser crashes on long files by switching to streaming backends.

**User stories:**
- As a **Creator**, I want to **zoom in** on the waveform so I can cut out a specific cough or pause.
- As a **User**, I want to **click and drag** on the waveform to create a new highlight.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massive jump in functionality (Zoom/Edit).
- ✅ Offloads complexity to a maintained library.

**Cons:**
- ❌ **Migration Effort:** Need to rewrite the component.
- ❌ **Dependencies:** Adds `wavesurfer.js` dependency (~30KB).

### 🛠️ Implementation Plan

**Phase 1: Foundation (POC & Setup)** (Completed)
- [x] Verify `wavesurfer.js` in Next.js environment.
- [x] Identify CSP requirements.
- [x] Create POC with Regions and Zoom.

**Phase 2: Core Component Replacement** (estimated: 3 days)
- [ ] Create `WavesurferPlayer` component to replace `src/components/audio/player.tsx` and `waveform.tsx`.
- [ ] Implement `RegionsPlugin` to render existing `highlights`.
- [ ] Sync playback state with global player context.

**Phase 3: Advanced Features** (estimated: 2 days)
- [ ] Implement "Drag to Create Highlight" interaction.
- [ ] Add Zoom slider to UI.
- [ ] Optimize for large files (Server-side peaks generation or MediaElement backend).

**Total estimated effort:** 1 week

### 📚 Resources

**Documentation:**
- [Wavesurfer.js v7 Docs](https://wavesurfer.xyz/)
- [Regions Plugin](https://wavesurfer.xyz/plugins/regions)

### 🎬 Next Steps

**If approved:**
1.  Merge the `wavesurfer.js` dependency.
2.  Begin Phase 2 (Component Replacement).
