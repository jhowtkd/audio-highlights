## 🔬 Researcher: Audio Loudness Normalization

### 🎯 Executive Summary
I propose adding an Audio Loudness Normalization feature to standardise the volume of output clips using FFmpeg's `loudnorm` filter. This ensures all generated highlights have a consistent, professional volume level suitable for podcast and social media platforms.

### 💡 Problem Statement
**Current situation:**
Audio files uploaded by users can have wildly varying volume levels. If an audio file is too quiet or too loud, the resulting highlights will retain these flawed volume levels.

**User impact:**
Users generating highlights for social media (e.g., TikTok, Instagram Reels) may produce clips that are too quiet, leading to low viewer engagement, or too loud and distorted, resulting in a poor user experience.

**Example scenario:**
A user uploads an unmastered raw interview recording that is very quiet. The generated highlight clips are barely audible when played back on a smartphone.

### 🚀 Proposed Solution
**What:**
Introduce an Audio Normalization option during the highlight generation or video cutting phase, using FFmpeg's `loudnorm` filter (EBU R128 standard).

**How it works:**
The `ffmpeg-service` will apply the filter `-af loudnorm=I=-16:TP=-1.5:LRA=11` during the re-encoding step when generating MP3/MP4 clips. This standardizes the Integrated Loudness (I), True Peak (TP), and Loudness Range (LRA).

**Why this approach:**
The `loudnorm` filter is an industry standard (EBU R128) for broadcast and streaming audio normalization. It intelligently adjusts volume without causing clipping or distortion, making it vastly superior to simple volume scaling (`-af volume=X`).

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg `loudnorm` filter.
- **Maturity:** Highly mature and industry standard.
- **Adoption:** Used by broadcasting networks, YouTube, Spotify, and Apple Music for loudness matching.

**Competitive Analysis:**
- Professional editors (Premiere, Audition) have built-in loudness matching tools.
- Modern podcaster tools like Descript auto-level audio by default.
- Our App: Currently passes through original volume unaltered.

**Best Practices:**
- Standard target for podcasts/web is often -16 LUFS (stereo) or -19 LUFS (mono).

### 🧪 Proof of Concept

**Implementation:**
A Proof of Concept script (`research/pocs/audio-normalization-poc.js`) was created. It generates a test audio file with very low volume (`volume=0.1`) and then normalizes it.

```javascript
// Excerpt from POC
const args = [
  '-y',
  '-i', TEST_FILE,
  '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
  OUTPUT_FILE
];
const proc = spawn(ffmpegPath, args);
```

**Demo:**
The POC successfully normalized the quiet input (705 kb/s) into a clearly audible, balanced output without introducing artifacts.

**Performance:**
- Impact on processing time: The `loudnorm` filter requires audio decoding and re-encoding, adding a slight overhead to processing time, but the increase is negligible for short clips.

### 📈 Value Proposition

**Benefits:**
- ✅ **Professional Quality:** Ensures all clips sound like they were professionally mastered.
- ✅ **Better UX:** Viewers won't need to adjust their device volume between clips.
- ✅ **Higher Engagement:** Clips with proper volume levels perform better on social media.

**User stories:**
- As a creator, I want my generated clips to automatically have a standard volume level so I don't have to adjust them manually in another app.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massively improves audio quality for unmastered inputs.
- ✅ Uses existing `ffmpeg-service` infrastructure.

**Cons:**
- ❌ Re-encoding is required (cannot use stream copy `-c copy` if normalization is applied).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Volume Normalizer (`volumedetect` + `volume`) | Simpler | Prone to clipping, doesn't respect perceived loudness | Not chosen because `loudnorm` is the modern standard. |
| Client-side Web Audio API | Offloads server | Hard to apply to exported files, complex implementation | Not chosen |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 day)
- [ ] Update `ffmpeg-service` to accept a `normalize` boolean parameter on endpoints.
- [ ] Apply the `-af loudnorm` filter if `normalize=true`.

**Phase 2: Core Feature** (estimated: 1 day)
- [ ] Add a "Normalize Audio" toggle switch in the Frontend `ConfigPanel`.
- [ ] Pass the parameter to the `cutVideo` and `cutMixVideo` hooks.

**Total estimated effort:** 2 developer-days

**Dependencies:**
- Existing FFmpeg infrastructure.

### 📚 Resources

**Documentation:**
- [FFmpeg Filters - loudnorm](https://ffmpeg.org/ffmpeg-filters.html#loudnorm)
- [EBU R128 Standard](https://tech.ebu.ch/loudness)

### 🎬 Next Steps

**If approved:**
1. Implement the `loudnorm` logic conditionally in the `ffmpeg-service` endpoints.
2. Add the UI toggle in the highlight settings.

### 💬 Discussion Points
- Should audio normalization be enabled by default, or an opt-in toggle?
- Given the slight performance overhead of re-encoding, do we want to perform this synchronously or offload to a background worker for extremely long mixes?
