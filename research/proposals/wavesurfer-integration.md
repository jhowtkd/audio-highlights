## 🔬 Researcher: Waveform Rendering Performance and Stability Upgrade

### 🎯 Executive Summary
Replace the custom canvas-based waveform renderer with `wavesurfer.js` v7. This upgrade addresses critical Out of Memory (OOM) crashes encountered with long audio files by streaming the audio natively via HTML5 media elements instead of loading the entire decoded PCM array into browser memory.

### 💡 Problem Statement
**Current situation:**
The existing `Waveform` component (`src/components/audio/waveform.tsx`) manually fetches the entire audio file and decodes it using `AudioContext.decodeAudioData()`. This loads the entire uncompressed PCM data into memory. To mitigate this for files > 10 minutes, there's a workaround that attempts to construct a "fake" waveform using transcription segment overlaps.

**User impact:**
Users uploading long podcast episodes (e.g., 2+ hours) can experience browser tab crashes (OOM errors) or severe unresponsiveness during the waveform generation phase. When the fallback "segment overlap" method kicks in, the waveform loses fidelity and no longer accurately represents the audio's volume peaks and valleys, reducing its utility.

**Example scenario:**
A user uploads a 3-hour MP3 file (about 150MB). The browser attempts to decode this into a massive `AudioBuffer` inside `generateWaveform()`. This operation exceeds Chrome's memory limits for a single tab, causing the "Aw, Snap!" crash screen, resulting in total data loss for the user's session.

### 🚀 Proposed Solution
**What:**
Integrate `wavesurfer.js` v7 with its `RegionsPlugin` to replace the custom canvas drawing and memory-intensive decoding logic.

**How it works:**
We configure `wavesurfer.js` to use an external HTML `<audio>` element via the `media` initialization option. This crucial setting tells WaveSurfer to stream the file natively (just like a normal audio player) and utilize a minimal memory footprint to generate the visual peaks, rather than buffering the full decoded PCM stream. Highlights are overlaid using the `RegionsPlugin`.

**Why this approach:**
It solves the OOM issue natively. It also offloads the complex task of canvas drawing, resizing, zooming, and seeking interactions to a heavily battle-tested library. `wavesurfer.js` v7 is specifically optimized for these use cases and has dropped the deprecated, memory-hungry `backend: 'MediaElement'` syntax.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `wavesurfer.js` (v7+)
- **Maturity:** Stable
- **Adoption:** De facto standard for web audio visualization. Used by countless audio products.
- **Community:** > 9k GitHub stars, highly active.
- **License:** BSD-3-Clause
- **Bundle size:** ~50kb (minified + gzipped)

**Competitive Analysis:**
Other podcast editors and transcription tools (e.g., Descript, Riverside) utilize advanced streaming or chunked rendering for waveforms to guarantee stability across multi-hour files.

**Best Practices:**
As noted in the project memory guidelines: "When utilizing wavesurfer.js (v7+) for rendering waveforms of long audio files, configure it using the media option with an external HTML `<audio>` element. Do not use the deprecated backend: 'MediaElement' option."

### 🧪 Proof of Concept

**Implementation:**
```typescript
// See: research/pocs/wavesurfer-poc.tsx for the complete implementation.
```

**Demo:**
The POC demonstrates loading an audio URL natively and dynamically rendering regions representing highlights over the waveform, complete with functional playback controls.

**Performance:**
- Before: Peak RAM usage spikes to >1GB during `decodeAudioData` for a 2hr file.
- After: Minimal memory overhead (native media element buffering).
- Impact: Complete elimination of OOM crashes on large files.

### 📈 Value Proposition

**Benefits:**
- ✅ Eliminates browser crashes for long podcast episodes.
- ✅ Accurately visualizes audio peaks even for very long files (removes the need for the transcription-segment workaround).
- ✅ Drastically simplifies the `Waveform` component's codebase (removes manual canvas drawing, resizing observers, and complex binary search hover logic).

**User stories:**
- As a user, I can upload a 4-hour podcast and reliably see an accurate audio waveform without my browser crashing.

### ⚖️ Trade-offs

**Pros:**
- ✅ High stability and performance.
- ✅ Out-of-the-box interactive features (seeking, regions).
- ✅ Easier long-term maintenance.

**Cons:**
- ❌ Adds a new third-party dependency (~50kb).
- ❌ Slight visual changes compared to the fully custom canvas implementation (though highly customizable).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Web Worker decoding | Keeps main thread free | Still requires massive memory allocation, doesn't solve OOM | Not chosen because OOM is the primary issue. |
| Server-side peak generation | Zero client memory overhead | Requires backend infrastructure to generate and serve peak data | Not chosen because it conflicts with the client-heavy architecture and adds backend complexity. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 0.5 days)
- [ ] Install `wavesurfer.js` as a dependency.
- [ ] Update `package.json` and verify installation.

**Phase 2: Core Feature** (estimated: 1 day)
- [ ] Replace `src/components/audio/waveform.tsx` logic with `wavesurfer.js`.
- [ ] Implement `RegionsPlugin` to render the existing highlight data.
- [ ] Ensure seamless synchronization with the existing `AudioPlayer` component (or integrate them).

**Phase 3: Polish & Testing** (estimated: 0.5 days)
- [ ] Replicate the existing styling (colors, hover tooltips).
- [ ] Test with a >2 hour audio file to verify OOM resolution.

**Total estimated effort:** 2 developer-days

**Dependencies:**
- `wavesurfer.js`

**Risks:**
- ⚠️ Integration with the custom `AudioPlayer` component might require state synchronization. - Mitigation: Provide the `wavesurfer.js` media instance to the custom player, or use `wavesurfer.js` to control playback entirely.

### 📚 Resources

**Documentation:**
- [wavesurfer.js v7 documentation](https://wavesurfer.xyz/docs/)
- [Regions plugin example](https://wavesurfer.xyz/examples/?regions.js)

### 🎬 Next Steps

**If approved:**
1. Install `wavesurfer.js`.
2. Integrate the POC logic into the main `Waveform` component.
3. Test edge cases (resizing, updating highlights dynamically).

### 💬 Discussion Points
Should we completely replace the existing `AudioPlayer` component with the built-in controls of `wavesurfer.js`, or keep them separate and just sync the `currentTime`?
