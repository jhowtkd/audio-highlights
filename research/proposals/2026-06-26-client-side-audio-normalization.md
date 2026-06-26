## 🔬 Researcher: Client-Side Audio Normalization

### 🎯 Executive Summary
Implement real-time audio volume normalization (Dynamic Range Compression) directly in the browser using the Web Audio API. This will solve the common issue of podcast files having uneven audio levels between speakers without requiring expensive or slow server-side FFmpeg processing.

### 💡 Problem Statement
**Current situation:**
Users upload unedited podcast recordings where one speaker might be very quiet while another is very loud, or there are sudden volume spikes (laughs, mic bumps).

**User impact:**
- **Poor Listening Experience:** Users have to constantly adjust their device volume while reviewing transcripts.
- **Low-Quality Highlights:** Exported clips retain the poor audio balancing, making them less suitable for direct social media sharing.

**Example scenario:**
A user is reviewing a 1-hour interview. The host is speaking at -12dB, but the guest is calling in remotely and speaking at -24dB. The user has to turn their laptop volume to 100% to hear the guest, but gets blasted by the host's laughter.

### 🚀 Proposed Solution
**What:**
Integrate a `DynamicsCompressorNode` from the native `Web Audio API` into the `AudioPlayer` component.

**How it works:**
1.  **Audio Routing:** Instead of playing the `<audio>` tag directly to the default output, we route it through an `AudioContext`.
2.  **Compression:** We pipe the source through a `DynamicsCompressorNode` configured to boost quiet signals and attenuate loud peaks.
3.  **Playback:** The compressed signal is sent to the `AudioContext.destination`.

**Why this approach:**
- **Zero Cost & Latency:** Runs natively in the browser on the client's CPU.
- **No Dependencies:** Relies entirely on built-in Web APIs (Web Audio API).
- **Real-time:** Applies immediately during playback, no waiting for a progress bar.

### 📊 Research Findings

**Technology Analysis:**
- **API:** Web Audio API (`AudioContext`, `MediaElementAudioSourceNode`, `DynamicsCompressorNode`).
- **Maturity:** Highly stable, supported in all modern browsers for years.
- **Performance:** Hardware-accelerated in most browsers, negligible CPU overhead.
- **Bundle size:** 0 bytes (native API).

**Competitive Analysis:**
- **Descript:** Applies "Studio Sound" (AI-based, server-side/heavy client-side).
- **Riverside.fm:** Offers "Magic Audio" normalization.
- **Our App:** Plays raw audio exactly as uploaded.

**Best Practices:**
- Provide a toggle (e.g., "Voice Boost" or "Normalize Audio") so users can turn it off if it introduces unwanted artifacts (like breathing noises becoming too loud).
- Handle browser autoplay policies (AudioContext must be resumed after a user gesture).

### 🧪 Proof of Concept

**Implementation:**
This can be achieved with a small update to the existing `AudioPlayer` ref logic:

```typescript
// Example Implementation in AudioPlayer
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const source = audioCtx.createMediaElementSource(audioRef.current);
const compressor = audioCtx.createDynamicsCompressor();

// Configure compression for spoken word
compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
compressor.knee.setValueAtTime(30, audioCtx.currentTime);
compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

source.connect(compressor);
compressor.connect(audioCtx.destination);
```

### 📈 Value Proposition

**Benefits:**
- ✅ **Improved Accessibility:** Makes quiet speech intelligible without blowing out eardrums.
- ✅ **Professional Feel:** Playback sounds closer to a finished, edited podcast.
- ✅ **Zero Cost:** No FFmpeg server time required for playback.

**User stories:**
- As a reviewer, I want the volume to be consistent across all speakers so I can listen comfortably.

### ⚖️ Trade-offs

**Pros:**
- ✅ Native browser feature, no new dependencies.
- ✅ Very low implementation effort.

**Cons:**
- ❌ **Export Limtation:** This only affects *playback* in the browser. Exported MP3s/Videos via FFmpeg will still have the original volume unless we also apply an FFmpeg `compand` or `loudnorm` filter during the export phase.
- ❌ **Artifacts:** Aggressive compression can raise the noise floor (background hiss).

### 🛠️ Implementation Plan

**Phase 1: Foundation & Playback** (estimated: 1 day)
- [ ] Add an `AudioContext` wrapper inside the `AudioPlayer` component.
- [ ] Implement a "Volume Normalization" UI toggle.
- [ ] Connect the `MediaElementAudioSourceNode` to the `DynamicsCompressorNode`.

**Phase 2: Export Integration (Optional but recommended)** (estimated: 1 day)
- [ ] Update `use-ffmpeg.ts` to apply an equivalent audio filter (e.g., `-af loudnorm`) when cutting clips, so the exported clip matches the normalized playback.

**Total estimated effort:** 2 developer-days

**Dependencies:**
- None.

### 📚 Resources

**Documentation:**
- [MDN: DynamicsCompressorNode](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode)
- [MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

**Examples:**
- [HTML5 Rocks: Developing Game Audio with the Web Audio API](https://www.html5rocks.com/en/tutorials/webaudio/games/)

**Community:**
- [W3C Web Audio API Specification](https://webaudio.github.io/web-audio-api/)

### 🎬 Next Steps

**If approved:**
1.  Implement the `AudioContext` graph in the `AudioPlayer`.
2.  Add a UI toggle for users to test the feature.

### 💬 Discussion Points
- Should this be enabled by default, or opt-in?
- Do we need to apply the equivalent `loudnorm` filter to FFmpeg exports immediately, or can it wait for a V2?
