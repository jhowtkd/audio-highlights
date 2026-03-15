## 🔬 Researcher: Migrate Audio Visualization to Wavesurfer.js

### 🎯 Executive Summary
Replace the custom canvas-based waveform implementation with `wavesurfer.js` to enable essential audio editing features like zooming, precise region selection, and better memory management. This upgrade will significantly improve the user experience for reviewing and editing long audio files.

### 💡 Problem Statement
**Current situation:**
The current waveform implementation (`src/components/audio/waveform.tsx`) uses a custom HTML5 Canvas drawing routine that relies on `AudioContext` to decode the entire audio file into memory. It statically extracts 200 samples and draws a fixed-width bar chart.

**User impact:**
- **No Zooming:** Users cannot zoom in on long audio files, making precise edits or reviewing short highlights nearly impossible.
- **Memory Inefficiency:** Decoding large audio files entirely into memory crashes tabs on low-end devices.
- **No Native Regions:** The current solution draws highlights as rectangles, lacking interaction like dragging to resize regions.

**Example scenario:**
A user uploads a 1-hour interview and wants to clip a specific 15-second response. The fixed-width waveform shows the entire hour in an 800px wide box, making the 15-second clip a sliver that is impossible to accurately select or adjust.

### 🚀 Proposed Solution
**What:**
Migrate the `<Waveform />` component to use `wavesurfer.js` along with its `RegionsPlugin`.

**How it works:**
- Initialize a `WaveSurfer` instance tied to a container ref.
- Use `wavesurfer.load(audioUrl)` which handles efficient decoding and streaming (or peak generation) internally.
- Use `RegionsPlugin` to draw AI-generated highlights natively over the waveform.
- Expose the built-in `.zoom(minPxPerSec)` method to allow users to zoom in and out.

**Why this approach:**
`wavesurfer.js` is the industry standard for web-based audio visualization. It handles the complex math, canvas rendering, and memory management optimizations required for large media files, letting us focus on the application logic rather than maintaining low-level drawing code.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `wavesurfer.js` (v7.x)
- **Maturity:** Stable
- **Adoption:** Used by Spotify, SoundCloud, and countless audio editing apps.
- **Community:** >9.5k GitHub stars, highly active.
- **License:** BSD-3-Clause
- **Bundle size:** ~50kb gzipped (core + regions plugin).

**Competitive Analysis:**
Professional audio editing tools online (like Descript, Riverside) universally provide zoomable timelines with draggable regions. Our custom static canvas is a major usability gap compared to them.

**Best Practices:**
- Unmount and `destroy()` the wavesurfer instance properly in `useEffect` cleanup to prevent memory leaks.
- Use the `RegionsPlugin` for drawing segments instead of custom overlay divs to ensure sync during zooming/scrolling.

### 🧪 Proof of Concept

**Implementation:**
```tsx
// See research/pocs/wavesurfer/Waveform.tsx for full implementation
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

// ...
const wavesurfer = WaveSurfer.create({
    container: containerRef.current,
    waveColor: '#cbd5e1',
    progressColor: '#3b82f6',
    minPxPerSec: 50, // Enables zooming
    plugins: [wsRegions]
});
wavesurfer.zoom(zoom * 50);
```

**Demo:**
N/A - See POC file.

**Performance:**
- Before: Decodes full file in main thread via AudioContext, high memory usage.
- After: Optimized drawing, better memory scaling.
- Impact: Smoother UI, less prone to OOM crashes on long files.

### 📈 Value Proposition

**Benefits:**
- ✅ **Precision Editing:** Zooming allows frame-accurate review of highlights.
- ✅ **Maintainability:** Removes 200+ lines of custom math and canvas drawing code.
- ✅ **Future-proofing:** Opens the door to draggable/resizable regions for manual user edits.

**User stories:**
- As a user, I can zoom in on the waveform so that I can see the exact start and end of a spoken sentence.

### ⚖️ Trade-offs

**Pros:**
- ✅ Instant zoom capability.
- ✅ Built-in regions and markers.
- ✅ Well-tested across browsers.

**Cons:**
- ❌ Adds a third-party dependency (~50kb).
- ❌ Slight styling constraints compared to raw canvas drawing.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Enhance Custom Canvas | Zero dependencies | Extremely complex to build performant zooming and virtualized rendering | Not chosen because it's reinventing a difficult wheel |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 days)
- [ ] Install `wavesurfer.js`.
- [ ] Replace `src/components/audio/waveform.tsx` with the POC structure.

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Wire up existing play/pause state to control wavesurfer.
- [ ] Integrate Zoom slider into the UI (e.g., in the task viewer).
- [ ] Ensure highlight tooltips work with the new regions plugin.

**Phase 3: Polish & Testing** (estimated: 1 days)
- [ ] Cross-browser testing (especially Safari audio context quirks).
- [ ] Verify memory usage on >1hr audio files.

**Total estimated effort:** 4 developer-days

**Dependencies:**
- `wavesurfer.js`

**Risks:**
- ⚠️ **React state syncing:** Wavesurfer manages its own internal playing/time state. - Mitigation: Carefully sync wavesurfer's `timeupdate` events to React state without causing infinite re-render loops.

### 📚 Resources

**Documentation:**
- https://wavesurfer.xyz/docs/

**Examples:**
- https://wavesurfer.xyz/examples/?regions.js
- https://wavesurfer.xyz/examples/?zoom.js

**Community:**
- https://github.com/katspaugh/wavesurfer.js

### 🎬 Next Steps

**If approved:**
1. Install dependency in the main project.
2. Begin Phase 1 replacement on a feature branch.
3. Conduct memory profiling.

### 💬 Discussion Points
- Should we allow users to drag/resize the AI-generated highlights immediately, or keep them read-only for v1?