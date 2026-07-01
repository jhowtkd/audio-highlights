## 🔬 Researcher: Real-Time Audio Normalization via Web Audio API

### 🎯 Executive Summary
Proposes implementing real-time dynamic range compression using the native Web Audio API to normalize audio playback volume. This zero-dependency solution prevents sudden volume spikes and makes quiet speakers audible without requiring server-side FFmpeg processing.

### 💡 Problem Statement
**Current situation:**
The `AudioPlayer` component plays uploaded podcasts directly without any audio processing. Podcasts often have significant volume variations between different speakers or segments.

**User impact:**
Users frequently need to manually adjust their device volume during playback, especially when one speaker is quiet and another is loud, or when unexpected loud sounds (like laughter) occur.

**Example scenario:**
A user is listening to a transcribed podcast on their headphones. Speaker A speaks softly, so the user turns up the volume. Suddenly, Speaker B laughs loudly, causing an uncomfortable volume spike that forces the user to quickly lower the volume.

### 🚀 Proposed Solution
**What:**
Implement real-time audio normalization using the `DynamicsCompressorNode` from the Web Audio API directly in the client-side `AudioPlayer`.

**How it works:**
1. Intercept the audio output from the existing `<audio>` element using `createMediaElementSource`.
2. Route the audio through a `DynamicsCompressorNode`.
3. Configure the compressor parameters (threshold, knee, ratio, attack, release) specifically for podcast dialogue.
4. Output the compressed audio to the `AudioContext.destination`.

**Why this approach:**
- Zero added bundle size (uses native browser APIs).
- Negligible CPU overhead.
- Instantaneous, requiring no pre-processing or server-side FFmpeg editing.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Native Web Audio API
- **Maturity:** Stable (supported in all modern browsers since 2013)
- **Adoption:** Industry standard for web-based audio processing
- **Community:** Highly documented by MDN and W3C
- **License:** Open Web Standard
- **Bundle size:** 0kb

**Competitive Analysis:**
- Pocket Casts / Overcast: Both offer "Voice Boost" or "Smart Speed" features that include dynamic range compression.
- YouTube: Automatically applies loudness normalization to videos.

**Best Practices:**
For spoken word (podcasts), the compressor should have a fast attack (~3ms) to catch sudden spikes, a moderate release (~250ms), a low threshold (-24dB), and a high ratio (12:1) to effectively level the volume.

### 🧪 Proof of Concept

**Implementation:**
```tsx
// See full PoC in research/pocs/audio-normalization-poc.tsx
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const source = audioCtx.createMediaElementSource(audioElement);
const compressor = audioCtx.createDynamicsCompressor();

compressor.threshold.value = -24;
compressor.knee.value = 30;
compressor.ratio.value = 12;
compressor.attack.value = 0.003;
compressor.release.value = 0.25;

source.connect(compressor);
compressor.connect(audioCtx.destination);
```

**Demo:**
The PoC includes a React component that allows toggling the normalization on and off during playback to instantly hear the difference.

**Performance:**
- Before: CPU usage <1% for standard audio playback.
- After: CPU usage remains <1% (hardware accelerated on most devices).
- Impact: Substantial UX improvement with unnoticeable performance penalty.

### 📈 Value Proposition

**Benefits:**
- ✅ Improved listening comfort by preventing volume spikes.
- ✅ Better intelligibility of quiet speakers.
- ✅ Zero server cost compared to server-side audio processing.

**User stories:**
- As a listener, I can hear both quiet and loud speakers clearly without constantly adjusting the volume, so that I have a comfortable and uninterrupted experience.

### ⚖️ Trade-offs

**Pros:**
- ✅ Native browser API (no dependencies).
- ✅ Real-time processing (no waiting for server).
- ✅ Easy to toggle on/off by the user.

**Cons:**
- ❌ Slight latency introduced by the audio context (typically unnoticeable for standard playback).
- ❌ Might affect the natural dynamics of highly produced music (though ideal for spoken word).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Server-side FFmpeg (`loudnorm`) | Permanent file fix, works on all devices | Requires CPU resources, delays playback availability | Not chosen because it's slow and costly. |
| GainNode with manual tracking | Simple | Doesn't handle sudden spikes well | Not chosen because `DynamicsCompressorNode` is built exactly for this. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 0.5 days)
- [ ] Implement `useAudioNormalization` hook.
- [ ] Add state for toggling normalization in `AudioPlayer`.

**Phase 2: Core Feature** (estimated: 0.5 days)
- [ ] Integrate hook into `src/components/audio/player.tsx`.
- [ ] Add UI toggle button (e.g., a "Volume Boost" icon) to the player controls.

**Phase 3: Polish & Testing** (estimated: 0.5 days)
- [ ] Test on various browsers (Safari, Chrome, Firefox).
- [ ] Ensure cleanup of `AudioContext` to prevent memory leaks.

**Total estimated effort:** 1.5 developer-days

**Dependencies:**
- None (Native Web API)

**Risks:**
- ⚠️ CORS issues with external audio URLs - Mitigation: Ensure `crossOrigin="anonymous"` is set on the `<audio>` element if loading from external domains.
- ⚠️ Autoplay policies - Mitigation: Only initialize `AudioContext` upon user interaction (e.g., clicking Play).

### 📚 Resources

**Documentation:**
- [MDN: DynamicsCompressorNode](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode)
- [Web Audio API W3C Spec](https://webaudio.github.io/web-audio-api/#DynamicsCompressorNode)

**Examples:**
- [HTML5 Rocks: Audio Processing](https://www.html5rocks.com/en/tutorials/webaudio/intro/)

**Community:**
- [Stack Overflow: Normalizing audio volume in browser](https://stackoverflow.com/questions/35650114/webaudio-dynamic-range-compression)

### 🎬 Next Steps

**If approved:**
1. Review the PoC in `research/pocs/audio-normalization-poc.tsx`.
2. Integrate into `src/components/audio/player.tsx`.
3. Add a user preference toggle in the app settings.

**Questions to resolve:**
- [ ] Should this feature be enabled by default, or opt-in via a UI toggle?
- [ ] Do we need to expose the compression threshold to advanced users?

### 💬 Discussion Points
Since this relies on Web Audio API, `MediaElementAudioSourceNode` requires the audio to be served with proper CORS headers if hosted on a separate CDN. Are there any current issues with CORS on the media server?
