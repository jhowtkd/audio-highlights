## 🔬 Researcher: Wavesurfer.js Upgrade

### 🎯 Executive Summary
I propose upgrading the custom audio waveform implementation to use `wavesurfer.js`. This resolves performance issues with large audio files (browser OOM crashes) and introduces zooming and interactive region features.

### 💡 Problem Statement
**Current situation:**
The `src/components/audio/waveform.tsx` uses `AudioContext.decodeAudioData` to manually process full audio files into a canvas waveform.
1. **Memory crashes:** On long files (e.g. 2-hour podcasts), decoding the full PCM data freezes or crashes the browser.
2. **Fixed resolution:** Downsamples the audio to 200 bars, meaning users can't see precise pauses.
3. **No zoom:** Users cannot zoom in to adjust highlight boundaries accurately.

**User impact:**
Users experience page crashes on long uploads and lack the precision needed for fine-grained editing.

**Example scenario:**
A user uploads a 4-hour podcast. The browser attempts to decode the entire 4 hours into memory for the canvas waveform, resulting in an immediate Out Of Memory (OOM) crash and forcing a page reload, losing their progress.

### 🚀 Proposed Solution
**What:**
Migrate `Waveform` component to use `wavesurfer.js` v7 with `RegionsPlugin`.

**How it works:**
- Use `wavesurfer.js` with `backend: 'MediaElement'` to decode audio in chunks, preventing memory crashes.
- Use `RegionsPlugin` to display Highlights as interactive colored regions.
- Enable `zoom()` API to allow deep zoom into the waveform.

**Why this approach:**
- Resolves the critical memory issue.
- Provides standard audio editing features (zoom, regions) with an established library.
- Dramatically reduces custom canvas code maintenance.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `wavesurfer.js` (v7)
- **Maturity:** Stable
- **Adoption:** Widely used industry standard for web audio visualization.
- **Community:** 9.6k GitHub stars, 600k+ weekly npm downloads.
- **License:** BSD-3-Clause
- **Bundle size:** ~20-30kb impact.

**Competitive Analysis:**
- Descript: Uses advanced waveform rendering with infinite zoom and text-to-audio sync.
- Riverside: Provides scalable waveforms that do not crash on long recordings.
- Our App: Fixed resolution canvas that crashes on files > 1 hour.

**Best Practices:**
- For long audio files, avoid decoding the entire buffer into memory. Instead, use chunked loading or pre-computed peak data (server-side).

### 🧪 Proof of Concept

**Implementation:**
```tsx
// See research/pocs/wavesurfer/Waveform.tsx
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

const ws = WaveSurfer.create({
    container: ref.current,
    backend: 'MediaElement', // Key optimization
});
```

**Demo:**
Refer to the local POC at `research/pocs/wavesurfer/Waveform.tsx` for the interactive zoom and region rendering capabilities.

**Performance:**
- Before: Full decode crash on 2h audio.
- After: Smooth load using MediaElement streaming.
- Impact: Critical stability improvement.

### 📈 Value Proposition

**Benefits:**
- ✅ **Stability:** Prevents OOM crashes on large files.
- ✅ **Precision:** Infinite zoom capabilities for exact editing.
- ✅ **Maintainability:** Removes complex custom canvas drawing logic.

**User stories:**
- As a creator, I want to zoom into the audio waveform so that I can precisely cut out a specific pause or stutter.
- As a user on a low-end device, I want the waveform to load without crashing my browser so that I can edit long podcasts.

### ⚖️ Trade-offs

**Pros:**
- ✅ Native zoom and scroll.
- ✅ Memory efficient.

**Cons:**
- ❌ Adds a third-party dependency.
- ❌ Might require style adjustments to match the old custom canvas exactly.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Keep Custom Canvas | No dependencies | Hard to add zoom, crashes on long files | Not chosen because it cannot scale to podcast lengths without massive rewrites. |
| Peaks.js | Built for long audio | Heavier, harder React integration | Not chosen because `wavesurfer.js` v7 offers similar performance with an easier API. |

### 🛠️ Implementation Plan

**Phase 1: Component Replacement** (estimated: 1 day)
- [ ] Install `wavesurfer.js`
- [ ] Re-implement `Waveform` component using `wavesurfer.js`

**Phase 2: Interaction** (estimated: 1 day)
- [ ] Map existing `highlights` prop to `RegionsPlugin`
- [ ] Add Zoom slider support

**Phase 3: Performance** (estimated: 1 day)
- [ ] Configure `MediaElement` backend for streaming

**Total estimated effort:** 3 developer-days

**Dependencies:**
- `wavesurfer.js`

**Risks:**
- ⚠️ Style mismatch - Mitigation: Adjust CSS to match old custom canvas exactly.

### 📚 Resources

**Documentation:**
- [Wavesurfer.js Official Docs](https://wavesurfer.xyz/docs/)
- [RegionsPlugin API](https://wavesurfer.xyz/docs/classes/plugins_regions.RegionsPlugin)

**Examples:**
- [Zoom Example](https://wavesurfer.xyz/examples/?zoom.js)
- [Regions Example](https://wavesurfer.xyz/examples/?regions.js)

**Community:**
- [GitHub repository](https://github.com/katspaugh/wavesurfer.js)

### 🎬 Next Steps

**If approved:**
1. Review POC in `research/pocs/wavesurfer/Waveform.tsx`.
2. Approve `wavesurfer.js` dependency.
3. Replace existing `Waveform` component.

**Questions to resolve:**
- [ ] Should we allow users to drag and drop region boundaries to adjust highlight start/end times directly on the waveform?
- [ ] Is the ~20-30kb bundle size increase acceptable for the performance and UX gains?

### 💬 Discussion Points
- Integrating server-side peak generation (using audiowaveform) for even faster initial loads on files > 2 hours.
