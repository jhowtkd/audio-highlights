## 🔬 Researcher: Real-Time Audio Volume Normalization

### 🎯 Executive Summary
Implement real-time audio volume normalization in the `AudioPlayer` component using the native Web Audio API's `DynamicsCompressorNode`. This approach ensures consistent volume levels across different podcast recordings without requiring server-side FFmpeg processing, saving bandwidth and processing time.

### 💡 Problem Statement
**Current situation:**
AudioHighlights allows users to upload various podcast files. These files often have wildly varying volume levels, with some segments being very quiet and others uncomfortably loud.

**User impact:**
Users have to constantly adjust their device volume while listening to highlights, leading to a poor user experience.

**Example scenario:**
A user uploads a 1-hour interview where the host speaks softly and the guest is very loud. The user struggles to find a comfortable listening volume.

### 🚀 Proposed Solution
**What:**
Integrate a `DynamicsCompressorNode` from the Web Audio API into the existing `<AudioPlayer>` component.

**How it works:**
The Web Audio API allows us to route the output of an `<audio>` element through an audio processing graph. By creating a `MediaElementAudioSourceNode` and connecting it to a `DynamicsCompressorNode` before the destination, we can automatically compress the dynamic range of the audio in real-time on the client side.

**Why this approach:**
This solution provides negligible overhead and zero added bundle size since it uses native browser APIs. It avoids the complexity and cost of processing audio on the server using FFmpeg, aligning perfectly with our goals of a responsive, performant client experience.

### 📊 Research Findings
**Technology Analysis:**
- **Library/Framework:** Native Web Audio API
- **Maturity:** Stable (supported in all modern browsers for years)
- **Adoption:** Industry standard for web-based audio processing
- **Bundle size:** 0 bytes (native API)

**Best Practices:**
Using `DynamicsCompressorNode` is the recommended way to handle automatic gain control and prevent clipping on the web.

### 🧪 Proof of Concept
**Implementation:**
See the PoC implemented in `research/pocs/dynamics-compressor-poc.tsx`.

**Performance:**
- Before: No normalization, varying volume.
- After: Consistent volume without CPU/memory spikes. Client-side processing is extremely efficient.

### 📈 Value Proposition
**Benefits:**
- ✅ Improved listening experience with consistent volume.
- ✅ Zero server-side processing cost or wait time.
- ✅ No added bundle size.

**User stories:**
- As a listener, I want the podcast volume to be consistent so I don't have to constantly adjust my volume controls.

### ⚖️ Trade-offs
**Pros:**
- ✅ Extremely fast, zero latency.
- ✅ Native browser feature.

**Cons:**
- ❌ Might introduce slight audio artifacts if compression is pushed too aggressively (requires careful tuning of threshold and ratio).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Server-side FFmpeg Normalization | High quality, permanent fix | High server load, slow processing time | Not chosen because it conflicts with our goal of client-side efficiency and creates a bottleneck. |

### 🛠️ Implementation Plan
**Phase 1: Integration** (estimated: 1 day)
- [ ] Add `DynamicsCompressorNode` logic to `src/components/audio/player.tsx`.
- [ ] Add a toggle in the UI to enable/disable normalization.

**Phase 2: Tuning & Testing** (estimated: 1 day)
- [ ] Fine-tune compressor settings (threshold, ratio, attack, release) for speech/podcast audio.
- [ ] Test across different browsers (Chrome, Firefox, Safari).

### 📚 Resources
**Documentation:**
- [MDN Web Docs: DynamicsCompressorNode](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode)
- [Web Audio API Recommendation](https://www.w3.org/TR/webaudio/)

### 🎬 Next Steps
**If approved:**
1. Review the PoC.
2. Integrate the compressor into the main `AudioPlayer` component.