## 🔬 Researcher: Client-Side Audio Normalization

### 🎯 Executive Summary
Implement real-time audio volume normalization directly in the browser during playback using the Web Audio API's `DynamicsCompressorNode`. This feature ensures consistent audio levels without the need for server-side processing, drastically improving the listening experience for podcasts with varying volume levels.

### 💡 Problem Statement
**Current situation:**
Podcast audio often has highly inconsistent volume levels. One speaker might be very quiet while another is loud, or there may be sudden loud noises.

**User impact:**
- **Poor UX:** Users have to constantly adjust their device volume.
- **Fatigue:** Listening to inconsistent audio is tiring.
- **Accessibility:** Hard for users with hearing difficulties to follow the content.

**Example scenario:**
A user is listening to an interview. The host is loud and clear, but the guest was recorded over a bad phone connection and is very quiet. The user turns up the volume to hear the guest, and then gets blasted when the host speaks again.

### 🚀 Proposed Solution
**What:**
Add a toggleable "Normalize Volume" feature to the `AudioPlayer` component.

**How it works:**
1. Intercept the audio playback using `AudioContext.createMediaElementSource()`.
2. Route the audio through a `DynamicsCompressorNode`.
3. The compressor automatically reduces the volume of loud sounds and amplifies quiet sounds in real-time.
4. Output the processed audio to `AudioContext.destination`.

**Why this approach:**
- **Zero Latency/Processing Time:** Happens in real-time during playback.
- **Zero Server Cost:** No FFmpeg processing required on the backend.
- **Negligible Bundle Size:** Uses native Web Audio API (no external libraries needed).

### 📊 Research Findings

**Technology Analysis:**
- **API:** Web Audio API (`AudioContext`, `DynamicsCompressorNode`, `MediaElementAudioSourceNode`).
- **Maturity:** Highly stable, supported in all modern browsers.
- **Performance:** Hardware-accelerated in most browsers, very low CPU usage.

**Competitive Analysis:**
- Many modern podcast players (e.g., Overcast "Voice Boost", Apple Podcasts) offer this feature.

### 🧪 Proof of Concept

**Implementation:**
A successful prototype was created in `research/pocs/audio-normalization-poc.tsx`.
The key finding is that `createMediaElementSource()` can only be called *once* per `<audio>` element. Trying to recreate it causes an `InvalidStateError`. Therefore, it's essential to track the initialized source using a `useRef`.

```tsx
// Excerpt from POC
const audioCtx = new AudioContext();
const source = audioCtx.createMediaElementSource(audioRef.current);
const compressor = audioCtx.createDynamicsCompressor();

// Configured for voice leveling
compressor.threshold.value = -50;
compressor.knee.value = 40;
compressor.ratio.value = 12;
compressor.attack.value = 0;
compressor.release.value = 0.25;

source.connect(compressor);
compressor.connect(audioCtx.destination);
```

**Results:**
The compressor effectively levels out quiet and loud voices, making the audio much easier to listen to without manual volume adjustments.

### 📈 Value Proposition

**Benefits:**
- ✅ **Massive UX Improvement:** Solves a major pain point with raw podcast audio.
- ✅ **No Backend Cost:** Free to run, unlike server-side FFmpeg normalization.
- ✅ **Instant:** Users can toggle it on and off instantly during playback.

### ⚖️ Trade-offs

**Pros:**
- ✅ Native browser API, no dependencies.
- ✅ Extremely fast and efficient.

**Cons:**
- ❌ **CORS Issues:** If the audio source is on a different domain, it MUST have CORS headers enabled (`crossorigin="anonymous"` on the `<audio>` tag), otherwise `createMediaElementSource` outputs silence for security reasons. *(Note: Since we use local blob URLs for uploaded files, this is not an issue for our main workflow).*
- ❌ **Slight Audio Distortion:** Heavy compression can sometimes make background noise more noticeable ("pumping" effect), but careful parameter tuning minimizes this.

### 🛠️ Implementation Plan

**Phase 1: Player Integration** (estimated: 1 day)
- [ ] Add `isNormalized` state to `AudioPlayer`.
- [ ] Implement `AudioContext` and `DynamicsCompressorNode` routing logic.
- [ ] Add a UI toggle (e.g., an "Audio Equalizer" icon button next to the volume control).

**Phase 2: Tuning & Testing** (estimated: 0.5 days)
- [ ] Fine-tune the compressor parameters specifically for speech.
- [ ] Test across different browsers (Chrome, Firefox, Safari) to ensure `AudioContext` initializes correctly (Safari sometimes requires it to be initialized on a user gesture).

**Total estimated effort:** 1.5 developer-days

**Dependencies:**
- None (Native Web Audio API).

### 🎬 Next Steps

**If approved:**
1. Update `AudioPlayer` to include the normalization logic.
2. Add the UI toggle.
