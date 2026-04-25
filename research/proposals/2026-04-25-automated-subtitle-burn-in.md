## 🔬 Researcher: Automated Subtitle Burn-in (Hardsubbing)

### 🎯 Executive Summary
I propose adding a feature to the `ffmpeg-service` that automatically burns generated subtitles directly into the video (hardsubbing). This allows creators to instantly export social-media-ready clips with captions, eliminating the need to use external software to attach SRT or VTT files.

### 💡 Problem Statement
**Current situation:**
The application generates accurate transcriptions and allows exporting them as `.srt` or `.vtt` files alongside the video clips. However, it does not burn these subtitles into the video itself.

**User impact:**
Users creating content for platforms like TikTok or Instagram Reels must import the video and subtitle files into a separate editor (like Premiere Pro or CapCut) to burn the subtitles in, adding friction to the workflow.

**Example scenario:**
A user generates a great 30-second highlight and downloads the `.mp4` and `.srt` files. To post it to Instagram, they still need another app to combine them visually.

### 🚀 Proposed Solution
**What:**
Enhance the `ffmpeg-service` with a new endpoint `POST /burn-subtitles` (or an option in `cut-video`/`concat-segments`) that uses the FFmpeg `subtitles` filter to hardsub the text onto the video stream.

**How it works:**
- The frontend sends the video file and the generated `.vtt` file to the service.
- The service runs FFmpeg with the `-vf "subtitles=input.vtt:force_style='FontSize=24,PrimaryColour=&H00FFFFFF'"` filter.
- Because filtering requires re-encoding, the service will re-encode the video track (e.g., `-c:v libx264`) while maintaining high quality.

**Why this approach:**
- **Convenience:** Delivers a final, platform-ready asset.
- **Reliability:** The `ffmpeg-static` package in our Node.js environment is compiled with `--enable-libass`, which is strictly required for the `subtitles` filter to process VTT/SRT files successfully.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg `subtitles` video filter (`libass`).
- **Maturity:** Highly mature and stable.
- **Dependencies:** `ffmpeg-static` (already installed and verified to support libass).

**Competitive Analysis:**
- **OpusClip / Veed.io:** Auto-caption burn-in is their core value proposition.
- **Our App:** Currently requires manual assembly.

### 🧪 Proof of Concept

**Implementation:**
```javascript
const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');

function burnSubtitles(videoPath, vttPath, outputPath) {
  const args = [
    '-i', videoPath,
    '-vf', `subtitles=${vttPath}`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-c:a', 'copy',
    outputPath
  ];
  return spawn(ffmpegPath, args);
}
```

**Performance:**
- Re-encoding video is CPU-intensive. A 30-second clip might take 5-10 seconds to process depending on the server hardware.
- Audio is stream-copied (`-c:a copy`) to save time.

### 📈 Value Proposition

**Benefits:**
- ✅ **Ready to Publish:** Users get a video they can upload directly to social media.
- ✅ **Increased Value:** Matches capabilities of premium clipping tools.

**User stories:**
- As a **Creator**, I want to download a video with hardcoded subtitles so that I can upload it immediately to TikTok without opening a video editor.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massive workflow improvement for end-users.
- ✅ Utilizes existing FFmpeg infrastructure.

**Cons:**
- ❌ **Processing Time:** Requires video re-encoding, unlike simple cutting which can use `-c copy`.
- ❌ **Server Load:** Will significantly increase CPU usage on the `ffmpeg-service` instance.

### 🛠️ Implementation Plan

**Phase 1: Service Update** (estimated: 2 days)
- [ ] Add subtitle burn-in support to `ffmpeg-service` endpoints.
- [ ] Verify styling options (font, size, colors) via FFmpeg `force_style`.

**Phase 2: Frontend Integration** (estimated: 2 days)
- [ ] Add "Burn Subtitles" toggle to the export dialog.
- [ ] Send the generated VTT to the backend along with the video during export.

**Total estimated effort:** 4 developer-days

### 📚 Resources

**Documentation:**
- [FFmpeg Subtitles Filter Documentation](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)
- [libass documentation](https://github.com/libass/libass)

### 🎬 Next Steps

**If approved:**
1. Test `ffmpeg-static` with complex `force_style` strings.
2. Implement the backend endpoint.