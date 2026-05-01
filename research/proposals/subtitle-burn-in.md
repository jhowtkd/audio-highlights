## 🔬 Researcher: Subtitle Burn-in (Hardsubbing) for Viral Clips

### 🎯 Executive Summary
This proposal recommends adding server-side subtitle burn-in (hardsubbing) to the `ffmpeg-service`. This allows users to export video highlights with embedded, styled subtitles directly, eliminating the need for external video editors and accelerating the creation of viral clips for TikTok, Instagram Reels, and YouTube Shorts.

### 💡 Problem Statement
**Current situation:**
The application generates highly accurate highlights and can export video clips (MP4) and subtitle files (SRT/VTT). However, it does not combine them.

**User impact:**
Users who want to post these clips to social media must use a third-party tool (like CapCut or Premiere Pro) to import the video, import the SRT, style the text, and re-export. This breaks the seamless workflow.

**Example scenario:**
A creator generates a 60-second highlight of a controversial podcast moment. To post it to TikTok, they have to download the MP4 and SRT, open CapCut, combine them, adjust the font size to be readable on mobile, and render it again.

### 🚀 Proposed Solution
**What:**
Enhance the `ffmpeg-service` with a new `POST /burn-subtitles` endpoint that accepts a video file, an SRT string, and basic styling parameters, returning a video with hardcoded subtitles.

**How it works:**
1. The frontend sends the video and the generated SRT content to the new endpoint.
2. The `ffmpeg-service` writes the SRT to a temporary file.
3. FFmpeg processes the video using the `subtitles` video filter (`-vf subtitles=sub.srt:force_style='...'`).
4. The audio is stream-copied (`-c:a copy`) to save processing time, while the video is re-encoded with the text burned in.

**Why this approach:**
- **Leverages existing infrastructure:** We already have a robust `ffmpeg-service`.
- **Capability:** `ffmpeg-static` is compiled with `--enable-libass`, supporting rich subtitle rendering and styling (fonts, colors, outlines).
- **Value:** Instantly makes the app an end-to-end clip generation tool, matching competitors.

### 📊 Research Findings

**Technology Analysis:**
- **Library:** FFmpeg (`subtitles` filter via `libass`)
- **Compatibility:** Supported by `ffmpeg-static` in our Node.js environment.
- **Performance:** Requires video re-encoding. A 60-second clip will take ~10-30 seconds depending on the server's CPU.

**Competitive Analysis:**
- **Opus Clip / Veed.io:** Core value proposition is automatic, styled, burned-in subtitles.
- **Our App:** Currently requires external tools for this step. Adding this brings us to feature parity for the basic viral clip workflow.

**Best Practices:**
- Use `force_style` to ensure subtitles are legible on mobile (e.g., large font, yellow/white text, black outline or background box).
- Limit to short clips (< 3 minutes) to prevent server overload.

### 🧪 Proof of Concept

**Implementation:**
A POC script can demonstrate the `subtitles` filter execution:

```javascript
const { spawn } = require('child_process');
const fs = require('fs');

async function burnSubtitles(videoPath, srtContent, outputPath) {
    fs.writeFileSync('temp.srt', srtContent);

    // Styling: Arial, size 24, White text, Black outline
    const style = "FontName=Arial,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,MarginV=20";

    const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vf', `subtitles=temp.srt:force_style='${style}'`,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-c:a', 'copy',
        outputPath
    ]);

    ffmpeg.on('close', (code) => {
        console.log(`Finished with code ${code}`);
    });
}
```

### 📈 Value Proposition

**Benefits:**
- ✅ **End-to-End Workflow:** Eliminates the need for third-party editing apps for basic clips.
- ✅ **Higher Engagement:** Hardsubbed videos perform significantly better on social media.
- ✅ **Competitive Parity:** Bridges the gap between our tool and dedicated clip generators.

**User stories:**
- As a **Creator**, I can **export a video with subtitles already on it**, so that **I can upload it directly to TikTok without extra editing.**

### ⚖️ Trade-offs

**Pros:**
- ✅ Massive workflow improvement for end users.
- ✅ Uses existing FFmpeg infrastructure.

**Cons:**
- ❌ **Server Load:** Video re-encoding is CPU intensive. High concurrency could stress the `ffmpeg-service`.
- ❌ **Styling Limits:** FFmpeg's `libass` is powerful but doesn't easily support dynamic word-by-word highlight animations without complex ASS file generation.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side (ffmpeg.wasm) | Zero server cost | Too slow/memory intensive for mobile browsers | Not chosen |
| Canvas/WebCodecs export | Great animation control | High engineering effort | Defer to v2 |

### 🛠️ Implementation Plan

**Phase 1: Backend Endpoint** (estimated: 2 days)
- [ ] Add `POST /burn-subtitles` to `ffmpeg-service/src/index.ts`.
- [ ] Implement temporary file handling for SRTs.
- [ ] Configure the FFmpeg spawn command with optimized x264 settings for fast encoding.

**Phase 2: Frontend Integration** (estimated: 2 days)
- [ ] Update `ExportOptions` to include "MP4 with Subtitles".
- [ ] Add basic styling options (Font size, Color) to the Export modal.
- [ ] Wire up the API call and handle the progress/download.

**Total estimated effort:** 4 developer-days

**Dependencies:**
- No new dependencies.

**Risks:**
- ⚠️ **CPU Bottleneck:** Re-encoding might queue up.
  - *Mitigation:* Implement a simple job queue or limit the maximum duration of clips that can be hardsubbed to 3 minutes.

### 📚 Resources

**Documentation:**
- [FFmpeg Subtitles Filter Documentation](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

### 🎬 Next Steps

**If approved:**
1. Test the exact FFmpeg `-vf subtitles` command locally to find the best default `force_style` string for 9:16 mobile videos.
2. Implement the backend endpoint.