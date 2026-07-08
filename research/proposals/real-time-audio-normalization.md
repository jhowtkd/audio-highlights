## 🔬 Researcher: Real-Time Audio Volume Normalization

### 🎯 Executive Summary
Implement real-time audio volume normalization using the native Web Audio API's `DynamicsCompressorNode`. This provides zero-dependency, zero-overhead volume leveling directly in the browser during playback, greatly improving user experience for media with uneven volume levels.

### 💡 Problem Statement
**Current situation:**
Users often upload audio or video files that have highly variable volume levels—some segments are extremely quiet, while others are very loud.

**User impact:**
Users frequently have to manually adjust the volume slider during playback to hear quiet parts, only to be blasted by loud parts moments later.

**Example scenario:**
A user is reviewing a recorded meeting where one participant is far from the microphone (quiet) and another is close (loud).

### 🚀 Proposed Solution
**What:**
Integrate real-time volume normalization directly into the client-side `AudioPlayer` component.

**How it works:**
We will utilize the native Web Audio API. By connecting the `HTMLMediaElement` to a `MediaElementAudioSourceNode`, routing it through a `DynamicsCompressorNode`, and finally to the `AudioContext.destination`, we can automatically compress loud sounds and boost quiet ones.

**Why this approach:**
It requires zero server-side processing, adding no backend cost or latency. It adds zero bytes to the bundle size because it relies entirely on native browser APIs. It is instantaneous and seamlessly integrates into the existing React audio player.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Native Web Audio API
- **Maturity:** Stable
- **Adoption:** Widespread (Standard Web API)
- **Community:** Native browser feature
- **License:** N/A
- **Bundle size:** 0kb

**Competitive Analysis:**
Most advanced web-based media players and DAW (Digital Audio Workstation) interfaces implement client-side audio effects to enhance playback.
- YouTube: Normalizes audio playback natively.
- Spotify Web: Implements client-side loudness equalization.

**Best Practices:**
Care must be taken to only call `createMediaElementSource()` once per `HTMLMediaElement` to avoid throwing an `InvalidStateError`. React `useRef` is ideal for tracking this initialization.

### 🧪 Proof of Concept

**Implementation:**
```typescript
// See research/pocs/audio-normalization-poc.tsx for full POC
const audioCtx = new window.AudioContext();
const source = audioCtx.createMediaElementSource(audioElement);
const compressor = audioCtx.createDynamicsCompressor();

compressor.threshold.value = -50;
compressor.knee.value = 40;
compressor.ratio.value = 12;
compressor.attack.value = 0;
compressor.release.value = 0.25;

source.connect(compressor);
compressor.connect(audioCtx.destination);
```

**Performance:**
- Before: Volume highly variable, requiring manual intervention.
- After: Consistent, leveled volume.
- Impact: Massive UX improvement with negligible CPU overhead.

### 📈 Value Proposition

**Benefits:**
- ✅ Zero server cost or processing time required.
- ✅ Zero added bundle size.
- ✅ Massive improvement in auditory comfort for end-users.

**User stories:**
- As a user, I can listen to recordings with inconsistent volume levels comfortably without touching the volume controls.

### ⚖️ Trade-offs

**Pros:**
- ✅ Instantaneous execution.
- ✅ No third-party libraries needed.

**Cons:**
- ❌ May slightly alter the perceived natural dynamics of high-fidelity music, though this app focuses on speech/podcasts where this is actually desired.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Server-side FFmpeg Loudnorm | Permanent file modification, works on all clients | High server CPU cost, slow, requires re-downloading media | Not chosen because Web Audio API achieves the same UX for playback instantly and for free. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 0.5 days)
- [ ] Update `AudioPlayer` component state to include a `normalizeVolume` toggle.
- [ ] Integrate Web Audio API setup within a `useEffect`.

**Phase 2: Core Feature** (estimated: 0.5 days)
- [ ] Implement `MediaElementAudioSourceNode` and `DynamicsCompressorNode` routing.
- [ ] Add UX control (e.g., a toggle button in the player controls) to enable/disable.

**Total estimated effort:** 1 developer-day

**Dependencies:**
- None (Native Web API)

**Risks:**
- ⚠️ React strict mode double-invocations causing `InvalidStateError` - Mitigation: strictly use `useRef` to track `sourceNode` instantiation.

### 📚 Resources

**Documentation:**
- [MDN: DynamicsCompressorNode](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode)
- [MDN: AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)

### 🎬 Next Steps

**If approved:**
1. Open PR implementing changes to `src/components/audio/player.tsx`.
2. Add tests verifying the toggle state.

### 💬 Discussion Points
Should normalization be enabled by default, or opt-in via a settings toggle?