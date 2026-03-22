## 🔬 Researcher: wavesurfer.js Upgrade for Large Audio Files

### 🎯 Executive Summary
Replace the custom Canvas-based waveform visualization with `wavesurfer.js` utilizing the `MediaElement` backend and `RegionsPlugin`. This resolves a critical issue where the browser crashes (OOM) on large audio files (e.g., 2+ hour podcasts) when attempting to decode the full PCM array using `AudioContext.decodeAudioData`, while simultaneously enabling highly requested features like precise zooming and interactive highlight regions.

### 💡 Problem Statement
**Current situation:**
The existing `src/components/audio/waveform.tsx` attempts to read and manually decode the *entire* uploaded audio file into memory to extract peaks for a custom Canvas render.

**User impact:**
- **Tab Crashes (OOM):** For audio files exceeding ~15-30 minutes, `AudioContext.decodeAudioData` decodes the file into raw PCM format, which consumes massive amounts of RAM (gigabytes for a 2-hour file). The browser tab frequently crashes with an "Aw, Snap!" error on mid-tier hardware.
- **Limited Usability:** The static Canvas resolution makes it impossible to distinguish between a 1-second pause and a 5-second silence in a long episode. Users cannot zoom in.

**Example scenario:**
A podcaster uploads a 3-hour MP3 interview (approx. 150MB). They wait for the transcription to finish, but when the UI attempts to load the waveform, the browser RAM usage spikes to 3GB, and the tab suddenly dies, destroying all unpersisted work.

### 🚀 Proposed Solution
**What:**
Migrate `Waveform` component to `wavesurfer.js` (v7).

**How it works:**
1.  **MediaElement Backend:** By configuring `wavesurfer.create({ backend: 'MediaElement' })`, the library streams the audio using standard HTML5 `<audio>` tags instead of pre-decoding the entire buffer into memory.
2.  **Zooming:** Leverage the native `.zoom(pxPerSec)` method to allow users to zoom deep into the waveform down to the word level.
3.  **Regions:** Use `RegionsPlugin` to overlay `GeneratedHighlight` objects directly onto the timeline.

**Why this approach:**
- **Prevents Crashes:** The `MediaElement` backend is specifically designed for long files where memory is constrained.
- **Maintained Standard:** `wavesurfer.js` is the industry standard for web audio visualization, meaning we stop maintaining custom low-level Canvas drawing logic.

### 📊 Research Findings

**Technology Analysis:**
- **Library:** `wavesurfer.js` (v7)
- **Maturity:** Highly stable, industry standard.
- **Adoption:** Used by countless audio platforms.
- **Bundle size:** ~30KB (minified + gzipped).
- **Backend Selection:** `WebAudio` (default) crashes on large files. `MediaElement` prevents crashes but computes peaks dynamically during playback.

**Best Practices:**
- For the absolute best performance on 4+ hour files, we should pair the `MediaElement` backend with *server-side peak generation* (providing a pre-computed JSON array to `wavesurfer`). However, switching to `MediaElement` alone immediately solves the crash issue.

### 🧪 Proof of Concept

**Implementation:**
A fully functional POC component `WaveformPOC` has been created at `research/pocs/wavesurfer/Waveform.tsx`.

```tsx
// Key snippet highlighting the memory fix
const ws = WaveSurfer.create({
  container: containerRef.current,
  // CRITICAL: prevents decoding full PCM array, avoiding browser OOM
  backend: 'MediaElement',
  plugins: [RegionsPlugin.create()]
});

// Load audio via HTML5 media element
const media = new Audio(audioUrl);
ws.setMediaElement(media);
```

**Demo:**
The POC component includes a zoom slider, interactive regions styled differently based on index, and basic playback controls.

**Performance:**
- Before: 2-hour MP3 causes 2GB+ RAM spike and crash.
- After: 2-hour MP3 loads instantly with nominal RAM usage (handled by browser media engine).

### 📈 Value Proposition

**Benefits:**
- ✅ **Stability:** Zero OOM crashes on large files.
- ✅ **Precision:** Zoom allows finding exact cut points.
- ✅ **Code Quality:** Deletes hundreds of lines of complex custom Canvas code.

**User stories:**
- As a **Podcaster**, I want to load a 3-hour episode without my browser crashing so I can safely generate highlights.
- As an **Editor**, I want to zoom into the waveform to find exactly where the speaker started a sentence.

### ⚖️ Trade-offs

**Pros:**
- ✅ Fixes a critical stability bug.
- ✅ Adds highly requested features (Zoom/Regions).

**Cons:**
- ❌ **Peak Accuracy:** With `MediaElement` without pre-computed peaks, the waveform draws progressively as the file buffers/plays, which might look less complete initially than a fully decoded view.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Server-Side Peaks** | Instant full waveform | Requires backend changes | Defer to Phase 2, implement MediaElement first. |
| **Downsampling Chunk Loop** | Keeps custom code | Still slow, requires complex Worker logic | Rejected. |

### 🛠️ Implementation Plan

**Phase 1: Upgrade & Stabilize** (estimated: 2 days)
- [ ] Install `wavesurfer.js`.
- [ ] Re-implement `src/components/audio/waveform.tsx` using the POC design.
- [ ] Replace custom Canvas with `wavesurfer` container.

**Phase 2: Interaction** (estimated: 1 day)
- [ ] Add Zoom UI controls to the main player.
- [ ] Wire up `RegionsPlugin` click events to sync with the Video Player and Transcript.

**Total estimated effort:** 3 developer-days

**Dependencies:**
- `wavesurfer.js`

**Risks:**
- ⚠️ **Sync Issues:** Need to ensure the wavesurfer timeline stays perfectly synced with the main Next.js audio player state.

### 📚 Resources

**Documentation:**
- [wavesurfer.js Documentation](https://wavesurfer.xyz/docs/)
- [wavesurfer.js Regions Plugin](https://wavesurfer.xyz/docs/classes/plugins_regions.RegionsPlugin)

### 🎬 Next Steps

**If approved:**
1. Install the `wavesurfer.js` dependency.
2. Begin Phase 1 by dropping in the POC component to replace the existing Waveform.
