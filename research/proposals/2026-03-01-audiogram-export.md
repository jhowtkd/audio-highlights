## 🔬 Researcher: Audiogram Export Feature

### 🎯 Executive Summary
Implement an audiogram generation feature using `ffmpeg` complex filtergraphs. This will allow users to export audio highlights as video clips with a dynamic waveform visualization, making them ready for social media platforms like Instagram Reels, TikTok, and YouTube Shorts.

### 💡 Problem Statement
**Current situation:**
Currently, audio highlights can only be exported as text (Markdown, SRT) or raw audio files (MP3). While the mix feature supports video, audio-only uploads cannot be easily shared on video-first platforms.

**User impact:**
Users sharing audio content (like podcast snippets) must use third-party tools (like Headliner or Canva) to convert their audio clips into videos with visual elements before posting them to social media.

**Example scenario:**
A podcaster generates a great 30-second audio highlight. To share it on Instagram Reels, they have to download the MP3, open another app, add a background image, add a waveform animation, render the video, and then finally upload it to Instagram.

### 🚀 Proposed Solution
**What:**
Add an "Export as Audiogram" option for audio highlights. The `ffmpeg-service` will generate an MP4 video combining a static background image/color, the audio highlight, and a dynamic waveform animation (using the `showwaves` or `showwavespic` filter).

**How it works:**
1. Expand the `ffmpeg-service` with a `/generate-audiogram` endpoint.
2. The service receives the audio clip (or its path), a background color (or image), and waveform style preferences (color, scale).
3. The service executes an `ffmpeg` command with a complex filtergraph, for example: `ffmpeg -i input.mp3 -f lavfi -i color=c=black:s=1080x1920 -filter_complex "[0:a]showwaves=s=1080x400:colors=White:mode=cline,format=yuv420p[wave];[1:v][wave]overlay=0:(H-h)/2[outv]" -map "[outv]" -map 0:a -c:v libx264 -c:a aac -shortest output.mp4`
4. The client receives the generated MP4 file.

**Why this approach:**
Server-side generation with FFmpeg is robust and does not require complex WebGL/Canvas rendering on the client side. It produces high-quality video files directly compatible with social networks.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg
- **Maturity:** Stable
- **Adoption:** Industry standard for media manipulation
- **Performance:** Rendering simple waveforms is fast compared to full video encoding, but still requires server CPU.

**Competitive Analysis:**
- Dedicated tools like Headliner, Veed, and Descript offer this as a core feature.
- Adding this built-in saves users a significant workflow step.

### 🧪 Proof of Concept

**Implementation:**
```typescript
// See research/pocs/audiogram-export/index.ts
```

### 📈 Value Proposition

**Benefits:**
- ✅ Direct social media readiness for audio content.
- ✅ Keeps users within the AudioHighlights ecosystem for the entire workflow.
- ✅ Visually engaging output increases shareability.

**User stories:**
- As a podcast creator, I want to export my audio highlights directly as an audiogram video so that I can immediately post them to TikTok and Instagram Reels.

### ⚖️ Trade-offs

**Pros:**
- ✅ High value-add for audio-only users.
- ✅ Extends the utility of the existing `ffmpeg-service`.

**Cons:**
- ❌ Increases computational load on the server (video encoding is CPU intensive).
- ❌ Initial implementation might have limited customization (e.g., fixed fonts for subtitles if added later) compared to dedicated editors.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side Canvas Recording (MediaRecorder) | Zero server cost | Often out of sync, lower quality, unreliable on mobile browsers. | Not chosen due to quality and reliability concerns. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 day)
- [x] Create POC script to validate FFmpeg waveform generation.
- [ ] Determine optimal default dimensions (e.g., 9:16 for shorts) and waveform styles.

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Add `/generate-audiogram` endpoint to `ffmpeg-service`.
- [ ] Ensure proper temporary file cleanup and error handling.

**Phase 3: Polish & Testing** (estimated: 1 day)
- [ ] Add "Export as Audiogram" button to the highlight card UI.
- [ ] Integrate endpoint call in `use-ffmpeg.ts`.

**Total estimated effort:** 4 developer-days

### 📚 Resources

**Documentation:**
- [FFmpeg showwaves filter](https://ffmpeg.org/ffmpeg-filters.html#showwaves)

### 🎬 Next Steps

**If approved:**
1. Review the POC output quality.
2. Discuss infrastructure implications for video encoding load on the `ffmpeg-service`.
