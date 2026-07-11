## 🔬 Researcher: Real-Time Audio Volume Normalization

### 🎯 Executive Summary
Implement real-time audio volume normalization for the web player using the native Web Audio API (`DynamicsCompressorNode`). This provides a massive UX improvement for listening to unedited podcasts with varying volume levels, with zero additional dependencies, zero API costs, and negligible performance overhead.

### 💡 Problem Statement
**Current situation:**
The built-in `<audio>` player (`src/components/audio/player.tsx`) plays media exactly as it was recorded. Many user-uploaded files (podcasts, raw interviews) have highly inconsistent volume levels—some speakers are too quiet, others are too loud, or sudden noises clip.

**User impact:**
Users are forced to constantly "ride the volume knob" (manually adjust their device volume) while listening, causing a frustrating experience, especially on mobile or with headphones.

**Example scenario:**
A user is listening to an interview. The host is very loud, but the guest was recorded far from the microphone. The user turns up the volume to hear the guest, and then gets blasted when the host speaks again.

### 🚀 Proposed Solution
**What:**
Add a toggle in the AudioPlayer component to enable "Volume Normalization" (Dynamic Range Compression) using the browser's native Web Audio API.

**How it works:**
1. Intercept the audio stream from the `HTMLMediaElement` using `audioContext.createMediaElementSource()`.
2. Route it through a `DynamicsCompressorNode` configured for dialogue (e.g., Threshold: -30dB, Ratio: 4:1).
3. Output the normalized audio to `audioContext.destination`.

**Why this approach:**
- **Zero Overhead:** Uses built-in browser APIs; no new dependencies.
- **Client-Side:** Real-time processing means we don't need expensive server-side FFmpeg processing to normalize the file.
- **Toggleable:** Users can turn it off if they prefer the original dynamic range.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Native Web Audio API (`DynamicsCompressorNode`)
- **Maturity:** Stable, universally supported across all modern browsers (Chrome, Firefox, Safari, Edge).
- **Performance:** Native C++ implementation in the browser; negligible CPU usage.
- **Bundle size:** 0kb added.

**Competitive Analysis:**
- Apple Podcasts: Has "Voice Isolation" and normalization features.
- Spotify: Normalizes volume by default.

**Best Practices:**
- `createMediaElementSource()` must only be called *once* per audio element to prevent `InvalidStateError`.
- Must handle browser autoplay policies (resuming `AudioContext` on user interaction).

### 🧪 Proof of Concept

**Implementation:**
A POC component was created in `research/pocs/audio-normalization-poc.tsx`. It demonstrates how to initialize the Web Audio API context safely, wire up the nodes, and toggle the compressor in real-time.

```tsx
// Core logic from POC
if (!audioContextRef.current) {
  audioContextRef.current = new AudioContext();
  sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
  compressorRef.current = audioContextRef.current.createDynamicsCompressor();

  compressorRef.current.threshold.value = -30;
  compressorRef.current.ratio.value = 4;
}
// Toggle routing...
sourceRef.current.connect(compressorRef.current);
compressorRef.current.connect(audioContextRef.current.destination);
```

**Demo:**
The POC successfully takes an audio stream and evens out the peaks and troughs without noticeable distortion, drastically improving the intelligibility of quiet sections.

### 📈 Value Proposition

**Benefits:**
- ✅ **Improved Accessibility:** Makes hard-to-hear audio intelligible without blasting the user's ears.
- ✅ **Professional Feel:** Gives the app a "pro" audio player feel compared to a basic HTML5 audio tag.
- ✅ **Cost-effective:** Solves an audio engineering problem for free on the client side.

**User stories:**
- As a listener, I can turn on "Normalize Volume" so I don't have to keep adjusting the volume when different people speak.

### ⚖️ Trade-offs

**Pros:**
- ✅ Zero bundle size impact.
- ✅ Instant real-time toggle.

**Cons:**
- ❌ Slightly changes the audio fidelity (compressors reduce dynamic range), which is why it should be a toggle.
- ❌ Requires careful state management in React to avoid calling `createMediaElementSource` twice.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Server-side FFmpeg normalization | Permanent fix for exported files | Extremely computationally expensive; requires storing a second copy of the file | Not chosen because client-side is free and immediate. |
| Third-party JS audio library (Tone.js) | Easier API | Adds unnecessary bundle size (100kb+) when we just need one node | Not chosen. Native API is sufficient. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 0.5 days)
- [ ] Add `isNormalized` state to `src/components/audio/player.tsx`.
- [ ] Implement `useEffect` or refs to initialize the `AudioContext` and nodes safely on first play/toggle.

**Phase 2: Core Feature** (estimated: 0.5 days)
- [ ] Add a UI toggle (e.g., an icon button near the volume control) in the player toolbar.
- [ ] Wire the toggle to connect/disconnect the `DynamicsCompressorNode`.

**Phase 3: Polish & Testing** (estimated: 0.5 days)
- [ ] Ensure cleanup of AudioContext on component unmount.
- [ ] Test cross-browser compatibility (specifically Safari's strict AudioContext rules).

**Total estimated effort:** 1.5 developer-days

**Dependencies:**
- None.

**Risks:**
- ⚠️ **Safari AudioContext Policy:** Safari requires `AudioContext` to be created or resumed on a user gesture. - Mitigation: Initialize/resume context inside the click handler of the Play or Normalize button.

### 📚 Resources

**Documentation:**
- [MDN Web Docs: DynamicsCompressorNode](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode)
- [MDN Web Docs: MediaElementAudioSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/MediaElementAudioSourceNode)

### 🎬 Next Steps

**If approved:**
1. Integrate the logic from the POC into `src/components/audio/player.tsx`.
2. Add a neat UI toggle icon.

### 💬 Discussion Points
- Should this be enabled by default, or strictly opt-in?
- Do we need to expose the compressor settings (threshold, ratio) to power users, or keep it simple?
