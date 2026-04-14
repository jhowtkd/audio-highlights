## 🔬 Researcher: Burnt-in Subtitles with FFmpeg

### 🎯 Executive Summary
This proposal introduces a new server-side capability to "burn" (hardcode) subtitles directly into video highlights using FFmpeg. This addresses a critical need for social media content creators who require captions permanently visible on their videos without relying on platform-specific subtitle files.

### 💡 Problem Statement
**Current situation:**
The `ffmpeg-service` currently cuts and concatenates videos extremely fast using stream copying (`-c copy`), but it does not support adding visual elements like subtitles. Users must export an SRT file and manually add it using third-party video editing software (like Premiere or CapCut) before posting to social media.

**User impact:**
Social media managers (our primary demographic for the viral highlights feature) consider burnt-in captions a mandatory requirement. The extra step of manual editing creates friction and reduces the perceived value of our "automated" highlighting feature.

**Example scenario:**
A user generates a 60-second TikTok highlight. They download the MP4 and the SRT file. They then have to open CapCut, import both files, style the text, and re-export. This takes 5-10 minutes per clip.

### 🚀 Proposed Solution
**What:**
Add a new endpoint `/burn-subtitles` to the `ffmpeg-service` that accepts a video file, an SRT string, and styling configuration, returning a video with hardcoded subtitles.

**How it works:**
1. The Node.js service receives the video and SRT text.
2. It writes the SRT to a temporary file.
3. It calls FFmpeg using the `subtitles` video filter (`-vf subtitles=temp.srt:force_style='...'`).
4. Because video filters cannot be applied without decoding, the video track is re-encoded (`-c:v libx264`), while the audio is copied (`-c:a copy`) to save some processing time.

**Why this approach:**
Native FFmpeg `subtitles` filter is the most robust way to hardcode text. It leverages standard SRT/ASS styling without requiring a headless browser (like Puppeteer/Remotion) which would be much heavier and slower.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg (`subtitles` filter)
- **Maturity:** Highly stable and industry standard.
- **Performance:** Re-encoding is CPU intensive. A 60-second 1080p clip may take 15-30 seconds to process depending on server hardware (compared to <1 second for stream copying).

**Best Practices:**
- Always copy the audio stream (`-c:a copy`) to avoid unnecessary re-encoding and quality loss.
- Use a fast preset (`-preset fast` or `veryfast`) for `libx264` to balance encoding speed and output file size, as these are meant for social media consumption.
- properly escape the SRT file path for FFmpeg, especially on Windows environments (colons and backslashes).

### 🧪 Proof of Concept

**Implementation:**
A POC script is available at `research/pocs/burnt-subtitles-poc.js`. It generates a test video and successfully burns an SRT file into it using `ffmpeg-static`.

```javascript
// Key FFmpeg command from POC:
const ffmpeg = spawn(ffmpegStatic, [
    '-y',
    '-i', inputVideo,
    '-vf', `subtitles='${escapedSrtPath}':force_style='Fontname=Arial,Fontsize=24,PrimaryColour=&H00FFFFFF'`,
    '-c:a', 'copy',
    '-c:v', 'libx264',
    '-preset', 'fast',
    outputPath
]);
```

**Performance:**
- Stream Copy (Current): ~0.1x real-time (Instant)
- Filter Re-encode (New): ~0.5x - 1.0x real-time (Takes about as long as the video duration on standard CPU).

### 📈 Value Proposition

**Benefits:**
- ✅ **Massive Time Saver:** Eliminates the need for third-party editing software.
- ✅ **Ready to Publish:** Users download a video they can immediately post to TikTok/Reels.
- ✅ **Competitive Parity:** Matches features offered by competitors like OpusClip or Munch.

**User stories:**
- As a social media manager, I want to download a clip with captions already on the screen so I can post it directly from my phone.

### ⚖️ Trade-offs

**Pros:**
- ✅ Extremely high value for users.
- ✅ Uses existing FFmpeg infrastructure.

**Cons:**
- ❌ **Server Cost:** Re-encoding requires significantly more CPU power than cutting.
- ❌ **Processing Time:** Users will have to wait longer for the final video to generate (progress bars will be needed).
- ❌ **Concurrency Limits:** We may need to queue processing to avoid crashing the Railway service under load.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Remotion / Headless Browser | Highly customizable animations (karaoke style) | Extremely resource intensive, requires separate server architecture | Not chosen for V1. Start with simple FFmpeg subtitles. |
| Client-side FFmpeg.wasm | Zero server cost | Too slow for 1080p video, prone to out-of-memory errors on mobile | Not chosen. Video encoding is too heavy for WASM currently. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Implement `/burn-subtitles` endpoint in `ffmpeg-service`.
- [ ] Add robust error handling and temporary file cleanup for SRTs.
- [ ] Test with various video resolutions and aspect ratios.

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Update frontend UI to offer "Download with Subtitles" option.
- [ ] Add customizable styling options (Font, Size, Color, Outline) to the UI.
- [ ] Update the API client to call the new endpoint.

**Phase 3: Polish & Testing** (estimated: 1 day)
- [ ] Add loading indicators/progress tracking on the frontend.
- [ ] Load testing the `ffmpeg-service` to determine concurrency limits.

**Total estimated effort:** 5 developer-days

**Dependencies:**
- `ffmpeg-service` infrastructure.

**Risks:**
- ⚠️ **Server Exhaustion:** High CPU usage could cause the Railway service to run out of credits or crash.
  - *Mitigation:* Implement a simple queue system in the microservice if necessary, or enforce strict video length limits.

### 🎬 Next Steps

**If approved:**
1. Create a PR to add the `/burn-subtitles` endpoint to the `ffmpeg-service`.
2. Deploy the updated service to a staging environment.
3. Begin frontend integration.

### 💬 Discussion Points
- Do we need to support dynamic karaoke-style highlighting, or are static standard subtitles enough for MVP?
- How should we handle the UX for the longer wait time? (e.g., email notification when ready vs. spinning loader).
