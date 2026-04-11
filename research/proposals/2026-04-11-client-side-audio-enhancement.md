## 🔬 Researcher: Client-Side Audio Enhancement (Voice Clarity)

### 🎯 Executive Summary
I propose adding a "Voice Enhance" toggle to the audio player that uses the native Web Audio API to boost vocal frequencies and volume. This will improve the listening experience for quiet or muffled podcasts without requiring backend processing or extra bundle size.

### 💡 Problem Statement
**Current situation:**
Users often upload podcast recordings that are poorly mixed, quiet, or have muffled voices. Currently, they have no way to adjust the audio within the application to hear the content better.

**User impact:**
Users struggle to review the audio accurately to verify the generated highlights, degrading the overall user experience.

**Example scenario:**
A user uploads a Zoom recording where one speaker is significantly quieter than the other. The transcription works fine, but when the user plays the audio to review a cut, they can barely hear the quiet speaker.

### 🚀 Proposed Solution
**What:**
Implement a client-side Audio Equalizer using the native `Web Audio API`. Specifically, a "Voice Enhance" toggle that applies a Gain node (volume boost) and a Peaking filter (EQ boost around 3kHz).

**How it works:**
The `MediaElementAudioSourceNode` intercepts the audio from the existing `<audio>` element. It routes the signal through a `BiquadFilterNode` (tuned for speech clarity) and a `GainNode` before sending it to the destination (speakers).

**Why this approach:**
-   **Zero Cost:** Native browser API, no external libraries needed.
-   **Instant Feedback:** Applied in real-time on the client.
-   **Privacy:** No audio data is sent to the server for enhancement.

### 📊 Research Findings

**Technology Analysis:**
-   **API:** `Web Audio API`
-   **Maturity:** Highly stable, supported in all modern browsers.
-   **Performance:** Negligible CPU impact for basic EQ and Gain.
-   **Bundle size:** 0kb.

**Competitive Analysis:**
-   Spotify: Has built-in Equalizer settings.
-   Overcast (Podcast App): "Voice Boost" is a core, beloved feature.

### 🧪 Proof of Concept

**Implementation:**
A POC class `AudioEnhancerPOC` has been created in `research/pocs/web-audio-api-poc.ts`. It demonstrates how to wrap an existing `HTMLAudioElement` and toggle the effect.

**Performance:**
Tested with a 2-hour audio file; memory and CPU usage remained unchanged.

### 📈 Value Proposition

**Benefits:**
-   ✅ Improves accessibility for hard-of-hearing users or poor recordings.
-   ✅ Zero infrastructure cost.
-   ✅ Immediate UX win that makes the app feel "premium".

**User stories:**
-   As a user, I want to click a "Voice Boost" button so I can clearly hear quiet speakers in my uploaded podcast.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Simple to implement.
-   ✅ No backend dependencies.

**Cons:**
-   ❌ Only affects playback, not the exported video/audio files (unless we add ffmpeg processing later).

### 🛠️ Implementation Plan

**Phase 1: Core Logic** (estimated: 0.5 days)
-   [ ] Integrate the `AudioEnhancer` logic into the `AudioPlayer` component.
-   [ ] Add a UI toggle button (e.g., a "Sparkle" or "Ear" icon) next to the volume controls.

**Phase 2: Polish** (estimated: 0.5 days)
-   [ ] Save the user's preference in `localStorage`.
-   [ ] Ensure the AudioContext resumes correctly after browser autoplay blocks.

**Total estimated effort:** 1 developer-day

### 🎬 Next Steps
**If approved:**
1.  Add the `AudioEnhancer` class to `src/lib/audio-utils.ts`.
2.  Update the `AudioPlayer` component UI.
