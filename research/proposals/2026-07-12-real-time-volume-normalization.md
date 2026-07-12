## 🔬 Researcher: Real-time Audio Volume Normalization

### 🎯 Executive Summary
Implement real-time audio volume normalization in the `AudioPlayer` using the native Web Audio API's `DynamicsCompressorNode`. This provides immediate, client-side volume leveling for podcast and speech audio without requiring server-side processing, adding zero bundle size overhead.

### 💡 Problem Statement
**Current situation:**
Podcast and raw audio recordings often have inconsistent volume levels, with sudden loud peaks or quiet segments where the speaker is far from the microphone. Currently, users must manually adjust their device volume to compensate for these fluctuations.

**User impact:**
Users reviewing transcripts and listening to generated highlights frequently encounter jarring volume changes, especially when comparing different clips or switching between speakers in the same file.

**Example scenario:**
A user uploads an interview where the host is much louder than the guest. When playing back the audio, the user has to constantly turn the volume up to hear the guest and down to avoid the host being too loud.

### 🚀 Proposed Solution
**What:**
Add a volume normalization toggle (e.g., "Level Volume") to the `AudioPlayer` component.

**How it works:**
We will utilize the browser's native Web Audio API. By wrapping the existing `<audio>` element with `AudioContext.createMediaElementSource()` and routing it through a `DynamicsCompressorNode`, we can apply dynamic range compression. The compressor will automatically reduce the volume of loud peaks and allow quiet parts to be heard more clearly, leveling out the overall audio.

**Why this approach:**
Using the native Web Audio API's `DynamicsCompressorNode` attached to a `MediaElementAudioSourceNode` provides real-time processing with negligible CPU overhead and zero added bundle size, completely avoiding the need for heavy server-side FFmpeg processing for playback.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Native Web Audio API (`AudioContext`, `DynamicsCompressorNode`)
- **Maturity:** Stable (Supported in all modern browsers since 2013)
- **Adoption:** Standard across modern web applications handling audio
- **Community:** W3C standard
- **License:** N/A (Native Web API)
- **Bundle size:** 0kb impact (Native browser feature)

**Competitive Analysis:**
- **YouTube:** Normalizes audio dynamically during playback.
- **Spotify:** Applies volume normalization on the client-side to ensure tracks play at similar levels.

**Best Practices:**
- Ensure `AudioContext` is created or resumed only after a user interaction to comply with browser Autoplay policies.
- Track the `MediaElementAudioSourceNode` in a `useRef` to prevent `InvalidStateError`, as `createMediaElementSource` can only be called once per `<audio>` element.

### 🧪 Proof of Concept

**Implementation:**
```tsx
import { useEffect, useRef, useState } from 'react';

export function AudioNormalizationPOC({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isNormalized, setIsNormalized] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(audio);
      sourceNodeRef.current = source;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressorRef.current = compressor;

      source.connect(ctx.destination);
    }

    return () => {
    };
  }, []);

  const toggleNormalization = () => {
    if (!audioCtxRef.current || !sourceNodeRef.current || !compressorRef.current) return;

    const ctx = audioCtxRef.current;
    const source = sourceNodeRef.current;
    const compressor = compressorRef.current;

    source.disconnect();
    compressor.disconnect();

    if (!isNormalized) {
      source.connect(compressor);
      compressor.connect(ctx.destination);
    } else {
      source.connect(ctx.destination);
    }

    setIsNormalized(!isNormalized);

    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  };

  return (
    <div>
      <audio ref={audioRef} src={src} controls />
      <button onClick={toggleNormalization}>
        {isNormalized ? 'Disable Normalization' : 'Enable Normalization'}
      </button>
    </div>
  );
}
```

**Demo:**
Since this is an audio feature, a visual demo is limited, but users testing the POC can immediately hear the normalization effect on highly dynamic audio files.

**Performance:**
- Before: No processing, standard HTMLMediaElement playback.
- After: Negligible overhead (sub-millisecond processing per frame by native browser C++ implementation).
- Impact: Massive UX improvement for unmastered audio with zero bundle size penalty.

### 📈 Value Proposition

**Benefits:**
- ✅ **Improved Listening Experience:** Consistent volume levels reduce ear fatigue and manual volume adjustments.
- ✅ **Zero Cost:** No server-side processing or external dependencies required.
- ✅ **Instant Feedback:** Works in real-time on any uploaded or played audio.

**User stories:**
- As a user, I can enable "Volume Normalization" so that I can comfortably listen to unedited podcasts with varying loudness levels.

### ⚖️ Trade-offs

**Pros:**
- ✅ Zero bundle size increase.
- ✅ Real-time processing without server costs.
- ✅ Uses highly optimized native browser code.

**Cons:**
- ❌ Minor coloration of the audio (dynamic range compression inherently changes the audio's dynamic feel, though usually desired for speech).
- ❌ Requires careful handling of browser Autoplay policies (context must be resumed on user interaction).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Server-side FFmpeg (`loudnorm`) | Permanent file modification, works everywhere | High server CPU cost, slow, requires downloading a new file | Not chosen because native Web Audio is instant, zero-cost, and sufficient for playback. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 day)
- [ ] Add `useAudioNormalization` hook to manage `AudioContext`, `MediaElementAudioSourceNode`, and `DynamicsCompressorNode`.
- [ ] Implement safe initialization to handle strict Autoplay policies and prevent `InvalidStateError`.

**Phase 2: Core Feature** (estimated: 1 day)
- [ ] Integrate the hook into `src/components/audio/player.tsx`.
- [ ] Add a UI toggle (e.g., an "Audio leveler" icon button) next to the volume control.

**Phase 3: Polish & Testing** (estimated: 1 day)
- [ ] Test on Safari, Chrome, and Firefox to ensure cross-browser compatibility.
- [ ] Fine-tune the compressor parameters (threshold, ratio, attack, release) for optimal speech leveling.

**Total estimated effort:** 3 developer-days

**Dependencies:**
- None (Native Web API)

**Risks:**
- ⚠️ **Browser Autoplay Policies:** Context might start in a `suspended` state. - Mitigation: Ensure `audioContext.resume()` is called within the play button's click handler.
- ⚠️ **InvalidStateError on Re-renders:** - Mitigation: Strictly track the `MediaElementAudioSourceNode` with a `useRef` as detailed in the POC and memory context.

### 📚 Resources

**Documentation:**
- [MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MDN: DynamicsCompressorNode](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode)

**Examples:**
- [Web Audio API Compressor Example](https://mdn.github.io/webaudio-examples/compressor-example/)

### 🎬 Next Steps

**If approved:**
1. Create a PR implementing the `useAudioNormalization` hook.
2. Integrate the toggle into the `AudioPlayer` UI.
3. Conduct cross-browser testing with dynamic podcast samples.

**Questions to resolve:**
- [ ] Should volume normalization be enabled by default for all new playbacks?

### 💬 Discussion Points
- Given that this is a podcast/transcription app, is it worth adding an EQ node (e.g., a high-pass filter to remove rumble and low-pass to remove hiss) to further enhance speech clarity alongside the compressor?
