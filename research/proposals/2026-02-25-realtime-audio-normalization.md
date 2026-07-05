## 🔬 Researcher: Real-time Audio Normalization during Playback

### 🎯 Executive Summary
Propose adding real-time audio volume normalization to the player using the native Web Audio API's `DynamicsCompressorNode`. This feature will improve user experience by automatically leveling uneven podcast audio directly in the browser, without requiring server-side FFmpeg processing or adding any bundle size.

### 💡 Problem Statement
**Current situation:**
Users often upload podcast episodes or raw audio recordings that have inconsistent volume levels (e.g., one speaker is too loud, another is too quiet). The current `AudioPlayer` component only provides basic volume controls, meaning users have to manually adjust the volume continuously when listening to uneven audio.

**User impact:**
Every user listening to raw or poorly mixed audio. Frequent volume adjustments are frustrating and disrupt the workflow when reviewing transcripts or generating highlights.

**Example scenario:**
A user uploads an interview where the host's microphone is much louder than the remote guest's. During playback, the user constantly scrambles to turn the volume up when the guest speaks and down when the host speaks.

### 🚀 Proposed Solution
**What:**
Add a real-time "Volume Normalization" (or Auto-Leveling) toggle to the `AudioPlayer` component.

**How it works:**
The solution will leverage the browser's native Web Audio API. By creating a `MediaElementAudioSourceNode` from the existing `<audio>` element and routing it through a `DynamicsCompressorNode` before reaching the `AudioDestinationNode` (speakers), we can automatically compress the dynamic range.
The compressor will be configured for speech (e.g., fast attack, high ratio) to boost quiet voices and attenuate loud peaks automatically.

**Why this approach:**
- **Zero Bundle Size:** Uses native browser APIs.
- **Negligible Overhead:** Audio processing is highly optimized in browsers.
- **Instantaneous:** No server-side processing or waiting time.
- **Opt-in:** Can be toggled on/off by the user.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Native Web Audio API (`DynamicsCompressorNode`)
- **Maturity:** Stable (Supported in all modern browsers since 2012)
- **Adoption:** Standard across modern web audio players.
- **Bundle size:** 0kb (Native API)

**Competitive Analysis:**
- Many professional audio editing tools and some modern web players (like Spotify) include built-in normalization to ensure consistent listening experiences.

**Best Practices:**
- Must instantiate the `AudioContext` only after user interaction (to comply with browser autoplay policies).
- Must call `audioContext.createMediaElementSource()` exactly once per `HTMLMediaElement` and store it in a `useRef` to prevent `InvalidStateError`.

### 🧪 Proof of Concept

**Implementation:**
```tsx
// See research/pocs/audio-normalization-poc.tsx
import { useEffect, useRef, useState } from 'react';

export function AudioPlayerWithNormalization({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const [isNormalized, setIsNormalized] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;

    // Track initialized source to prevent InvalidStateError
    if (!sourceRef.current) {
      sourceRef.current = ctx.createMediaElementSource(audio);
    }
    if (!compressorRef.current) {
      compressorRef.current = ctx.createDynamicsCompressor();
      compressorRef.current.threshold.value = -24;
      compressorRef.current.knee.value = 30;
      compressorRef.current.ratio.value = 12;
      compressorRef.current.attack.value = 0.003;
      compressorRef.current.release.value = 0.25;
    }

    const source = sourceRef.current;
    const compressor = compressorRef.current;

    source.disconnect();
    if (isNormalized) {
      source.connect(compressor);
      compressor.connect(ctx.destination);
    } else {
      source.connect(ctx.destination);
    }

    return () => {
      source.disconnect();
      compressor.disconnect();
    };
  }, [isNormalized]);

  return (
    <div>
      <audio ref={audioRef} src={src} controls />
      <button onClick={() => setIsNormalized(!isNormalized)}>Toggle Normalization</button>
    </div>
  );
}
```

### 📈 Value Proposition

**Benefits:**
- ✅ Improved listening experience for uneven audio.
- ✅ Zero server cost or processing time compared to FFmpeg-based normalization.
- ✅ No additional bundle size.

**User stories:**
- As a user, I want the player to automatically level the volume of different speakers so that I don't have to manually adjust the volume slider continuously.

### ⚖️ Trade-offs

**Pros:**
- ✅ Extremely lightweight and performant.
- ✅ Instant results (client-side).

**Cons:**
- ❌ Only applies during browser playback (exported clips will not have normalization applied unless we also add a server-side FFmpeg pass for exports later).
- ❌ Might introduce slight audio artifacts if the original audio is already heavily compressed.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Server-side FFmpeg (`loudnorm`) | Applies to exported files as well | Requires server processing, delays playback, consumes server resources | Not chosen for playback because it disrupts the instant UX. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 days)
- [ ] Implement Web Audio API integration in `src/components/audio/player.tsx`.
- [ ] Add state and UI toggle for "Normalize Audio" (e.g., using a wand or equalizer icon).

**Phase 2: Core Feature** (estimated: 1 days)
- [ ] Fine-tune `DynamicsCompressorNode` settings specifically for spoken word/podcasts.
- [ ] Ensure robust cleanup and handle edge cases (like `AudioContext` suspension state).

**Phase 3: Polish & Testing** (estimated: 1 days)
- [ ] Verify functionality across different browsers (Safari's webkitAudioContext, Chrome, Firefox).
- [ ] Add accessibility labels to the new toggle.

**Total estimated effort:** 3 developer-days

**Dependencies:**
- None (Native APIs only)

**Risks:**
- ⚠️ `InvalidStateError` if `createMediaElementSource` is called multiple times. - Mitigation: Track the initialized source node using a `useRef`.
- ⚠️ Autoplay policy blocking `AudioContext`. - Mitigation: Initialize or resume `AudioContext` only on user interaction (e.g., when clicking Play or the Normalize toggle).

### 📚 Resources

**Documentation:**
- [MDN: DynamicsCompressorNode](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode)
- [MDN: MediaElementAudioSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/MediaElementAudioSourceNode)

### 🎬 Next Steps

**If approved:**
1. Implement the feature in `src/components/audio/player.tsx`.
2. Add a toggle button to the player UI.
3. Test with varying audio files.

### 💬 Discussion Points
- Should normalization be enabled by default, or opt-in per session?
- Do we eventually want to apply this normalization to the exported video clips using FFmpeg?
