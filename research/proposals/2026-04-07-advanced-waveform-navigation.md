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

**Example scenario:**
A user tries to edit a 2-hour podcast to trim a 5-second silence at the beginning of a highlight. With a fixed 200-bar resolution, a single bar represents 36 seconds, making it impossible to see the exact start and end points of the 5-second silence. Additionally, the browser may crash when trying to load the audio data into the WebAudio context.

### 🚀 Proposed Solution
**What:**
Refactor `Waveform` to use `wavesurfer.js` (v7) with the `RegionsPlugin` and `ZoomPlugin`.

**How it works:**
- **Zooming:** `wavesurfer.js` handles scrollable canvases natively.
- **Regions:** Use `RegionsPlugin` to visualize Highlights as interactive, draggable overlays instead of static colored rectangles.
- **Performance:** `wavesurfer.js` supports decoding in chunks (MediaElement backend via the `media` property using an HTML `<audio>` element) or using pre-generated JSON peaks (server-side), avoiding the OOM crash.

**Why this approach:**
- **Standardization:** Stop maintaining custom low-level canvas code.
- **Features:** Zoom, Regions, Timeline are built-in.
- **Performance:** Better handling of large files using native media streaming and avoiding full PCM decode.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `wavesurfer.js` (v7+)
- **Maturity:** Stable
- **Adoption:** Widely used for web audio visualization
- **Community:** 10k+ stars on GitHub
- **License:** BSD-3-Clause
- **Bundle size:** ~30KB (core library, worth the feature set)

**Competitive Analysis:**
Professional audio and video editing tools (e.g., Descript, Premiere Pro) all feature zoomable, interactive waveforms.
- Product A (Descript): Interactive waveform editing is a core feature.
- Product B (Riverside): Offers zoomable waveforms in its editor.

**Best Practices:**
- Use the `media` option with a hidden HTML `<audio>` element instead of relying on `backend: 'MediaElement'` (deprecated in v7). This prevents the browser from loading the entire audio into memory.

### 🧪 Proof of Concept

**Implementation:**
```tsx
// See research/pocs/waveform-poc.tsx
```

**Performance:**
- Before: Full decode of audio file into RAM, high memory usage, potential OOM crashes.
- After: Native HTML media streaming, minimal memory footprint.
- Impact: Solves OOM crashes on large files, provides a smooth zooming experience.

### 📈 Value Proposition

**Benefits:**
- ✅ **Precision Editing:** Zoom in to see individual words/breaths.
- ✅ **Interactive Highlights:** Users could drag highlight boundaries to adjust them (new feature possibility).
- ✅ **Stability:** Prevent browser crashes on long files by using the native media streaming backend.

**User stories:**
- As a **Creator**, I want to **zoom in** on the waveform so I can cut out a specific cough or pause.
- As a **User**, I want to **click and drag** on the waveform to create a new highlight.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massive jump in functionality (Zoom/Edit).
- ✅ Offloads complexity to a maintained library.

**Cons:**
- ❌ **Migration Effort:** Need to rewrite the component.
- ❌ **Dependencies:** Adds a dependency (`wavesurfer.js`).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Improve Custom Canvas | No extra dependencies | Still hard to add zoom and interactivity, requires complex memory management | Not chosen due to maintenance overhead |
| Peak.js | Feature-rich | Larger bundle, more complex API | Not chosen, `wavesurfer.js` is simpler for our use case |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Install `wavesurfer.js`.
- [ ] Implement the new `Waveform` component based on the POC, using the `media` property.

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Map existing `highlights` prop to `RegionsPlugin`.
- [ ] Add Zoom slider/scroll wheel support.

**Phase 3: Polish & Testing** (estimated: 1 day)
- [ ] Test with large audio files to confirm OOM issues are resolved.
- [ ] Verify interaction and synchronization with the rest of the application.

**Total estimated effort:** 5 developer-days

**Dependencies:**
- `wavesurfer.js`

**Risks:**
- ⚠️ Integration with existing player state - Mitigation: Carefully map `wavesurfer` events to existing `onSeek` callbacks.

### 📚 Resources

**Documentation:**
- [Wavesurfer.js Official Documentation](https://wavesurfer.xyz/docs/)
- [Regions Plugin Documentation](https://wavesurfer.xyz/docs/classes/plugins_regions.RegionsPlugin)

**Examples:**
- [Wavesurfer.js Zoom Example](https://wavesurfer.xyz/examples/?zoom.js)
- [Wavesurfer.js Regions Example](https://wavesurfer.xyz/examples/?regions.js)

### 🎬 Next Steps

**If approved:**
1. Install `wavesurfer.js`.
2. Replace `src/components/audio/waveform.tsx` with the implementation outlined in the POC.
3. Test thoroughly with large podcasts.

### 💬 Discussion Points
- Do we want to enable users to drag and drop region boundaries immediately, or just provide zoom capability in the first iteration?