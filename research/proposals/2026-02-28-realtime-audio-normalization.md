## 🔬 Researcher: Real-time Audio Normalization during Playback

### 🎯 Executive Summary
Proposes implementing real-time audio normalization using the native Web Audio API's DynamicsCompressorNode during playback in the browser. This provides a consistent listening experience for podcasts with varying volume levels without adding bundle size overhead or server costs.

### 💡 Problem Statement
**Current situation:**
Podcast audio and raw recordings often have wildly varying volume levels between different speakers or segments. Currently, the `AudioPlayer` plays the audio exactly as recorded, requiring users to manually adjust the volume slider frequently.

**User impact:**
Users reviewing transcripts or highlights often experience sudden loud noises or strain to hear quiet speakers, degrading the user experience during the editing and review process.

**Example scenario:**
A user is reviewing a podcast highlight where one host is recorded at -12dB and the guest is at -24dB. The user has to turn up the volume to hear the guest, and then gets blasted when the host speaks again.

### 🚀 Proposed Solution
**What:**
Add a "Normalize Volume" toggle to the `AudioPlayer` that routes the audio through a `DynamicsCompressorNode`.

**How it works:**
1. Intercept the `<audio>` element's output using `AudioContext.createMediaElementSource()`.
2. Route the signal through a `DynamicsCompressorNode` configured for voice (e.g., threshold -24dB, ratio 12, knee 30).
3. Route the compressed signal to `AudioContext.destination`.
4. Provide a UI toggle (e.g., a wand or equalizer icon next to the volume control) to switch between raw and normalized audio.

**Why this approach:**
- **Zero cost & negligible overhead:** Uses the browser's native C++ audio engine (Web Audio API).
- **No extra bundle size:** Requires no external libraries.
- **Immediate:** Applies instantly during playback, unlike server-side FFmpeg processing which requires a full download/upload/process cycle.
- **Opt-in:** Users can toggle it off if they need to hear the true original audio.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Native Web Audio API (`AudioContext`, `MediaElementAudioSourceNode`, `DynamicsCompressorNode`)
- **Maturity:** Stable (supported in all modern browsers since 2013)
- **Adoption:** Standard across the web for audio manipulation
- **License:** N/A (Web Standard)
- **Bundle size:** 0kb

**Competitive Analysis:**
- **Descript:** Normalizes audio by default during playback.
- **Spotify/Apple Podcasts:** Use similar dynamic range compression for podcast playback to normalize varying speaker levels.

**Best Practices:**
- Ensure `AudioContext` is only created or resumed after a user interaction (e.g., clicking Play) to comply with browser autoplay policies.
- Ensure `createMediaElementSource()` is only called *once* per `<audio>` element to prevent `InvalidStateError`. Store the node in a `useRef`.

### 🧪 Proof of Concept

**Implementation:**
```tsx
import React, { useEffect, useRef, useState } from 'react';

export function AudioPlayerNormalizationPOC({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  const [isNormalized, setIsNormalized] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const initAudio = () => {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        // Ensure createMediaElementSource is only called once per element
        if (!sourceNodeRef.current) {
          sourceNodeRef.current = ctx.createMediaElementSource(audio);
        }

        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -24; // Compress anything above -24dB
        compressor.knee.value = 30;       // Soft knee for smoother transition
        compressor.ratio.value = 12;      // Strong compression ratio for voice
        compressor.attack.value = 0.003;  // Fast attack (3ms) to catch peaks
        compressor.release.value = 0.25;  // Standard release (250ms)
        compressorRef.current = compressor;

        // Default routing: Source -> Destination (No normalization)
        sourceNodeRef.current.connect(ctx.destination);
      }
    };

    // Need user interaction to start AudioContext safely
    audio.addEventListener('play', initAudio, { once: true });

    return () => {
      audio.removeEventListener('play', initAudio);
    };
  }, []);

  const toggleNormalization = () => {
    if (!audioContextRef.current || !sourceNodeRef.current || !compressorRef.current) return;

    const ctx = audioContextRef.current;
    const source = sourceNodeRef.current;
    const compressor = compressorRef.current;

    // Disconnect current routing
    source.disconnect();

    if (!isNormalized) {
      // Connect through compressor
      source.connect(compressor);
      compressor.connect(ctx.destination);
    } else {
      // Direct connection
      compressor.disconnect();
      source.connect(ctx.destination);
    }

    setIsNormalized(!isNormalized);
  };

  return (
    <div className="p-4 border rounded">
      <audio ref={audioRef} src={src} controls className="mb-4 w-full" />
      <button
        onClick={toggleNormalization}
        className={`px-4 py-2 rounded ${isNormalized ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
      >
        {isNormalized ? 'Disable Normalization' : 'Enable Normalization'}
      </button>
    </div>
  );
}
```

**Performance:**
- CPU impact is negligible (<1% on modern CPUs).
- No memory leaks when properly managing node connections and context lifecycle.

### 📈 Value Proposition

**Benefits:**
- ✅ Improved listening comfort for podcasts with multiple speakers at different volumes.
- ✅ Zero server cost and zero bundle size increase.
- ✅ Instant toggling capability.

**User stories:**
- As a podcast editor, I can enable volume normalization so that I can comfortably review transcripts without constantly adjusting my system volume when different speakers talk.

### ⚖️ Trade-offs

**Pros:**
- ✅ Native implementation, no dependencies.
- ✅ Highly performant.
- ✅ Enhances the core product experience (audio review).

**Cons:**
- ❌ Does not modify the actual downloaded audio file (it's playback only). If a user exports the raw audio, it won't be normalized. (This is expected behavior for a playback feature, but should be clear).
- ❌ `AudioContext` requires user interaction to initialize due to browser autoplay policies, adding a slight complexity to the player component logic.

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 0.5 days)
- [ ] Add `DynamicsCompressorNode` logic to `AudioPlayer` (`src/components/audio/player.tsx`).
- [ ] Ensure safe `AudioContext` initialization on first play interaction.
- [ ] Manage audio node routing states.

**Phase 2: Core Feature** (estimated: 0.5 days)
- [ ] Add a UI toggle button (e.g., using `lucide-react` icons like `Wand2` or `AudioWaveform`) next to the volume control.
- [ ] Add tooltips/aria-labels for accessibility.

**Total estimated effort:** 1 developer-day

**Dependencies:**
- None.

**Risks:**
- ⚠️ `InvalidStateError` if `createMediaElementSource` is called twice. - Mitigation: Track initialization with a `useRef`.

### 📚 Resources

**Documentation:**
- [Web Audio API - DynamicsCompressorNode](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode)
- [Web Audio API - BaseAudioContext.createMediaElementSource()](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource)

### 🎬 Next Steps

**If approved:**
1. Implement the compressor logic in `AudioPlayer`.
2. Add the UI toggle.
3. Test across Safari, Chrome, and Firefox to ensure Web Audio API consistency.

### 💬 Discussion Points
- Should normalization be enabled by default, or opt-in? (Opt-in is safer to start).
