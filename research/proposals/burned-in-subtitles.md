## 🔬 Researcher: Burned-in Subtitles for Video Highlights

### 🎯 Executive Summary
Propose adding a feature to automatically burn in subtitles (hardsubs) directly into the exported video highlights. This eliminates the need for users to manually combine video and SRT files in external video editors before posting to social media.

### 💡 Problem Statement
**Current situation:**
Currently, users can export a highlight as a video clip (via `ffmpeg-service`) and download the transcription as an SRT/VTT file separately.

**User impact:**
Social media platforms (TikTok, Instagram Reels, YouTube Shorts) heavily favor videos with burned-in captions. To post the generated highlights, users must use a third-party tool to merge the video and the SRT file. This adds significant friction to the workflow.

**Example scenario:**
A creator generates a 60-second highlight. They download `clip.mp4` and `clip.srt`. They then have to open CapCut, import both, adjust styling, and re-export before they can post to TikTok.

### 🚀 Proposed Solution
**What:**
Enhance the `ffmpeg-service` to accept an SRT file during the highlight generation or export phase and use FFmpeg's `subtitles` video filter to burn the text directly onto the video frames.

**How it works:**
1.  **Frontend:** The frontend generates the SRT string for the specific highlight.
2.  **API:** When requesting a video export, the frontend sends both the segment timestamps and the SRT content.
3.  **Backend (`ffmpeg-service`):**
    - Saves the SRT content to a temporary file.
    - Uses the `-vf subtitles=temp.srt` filter in FFmpeg.
    - Note: The absolute path to the subtitle file must be escaped using `.replace(/\\/g, '/').replace(/:/g, '\\:')` to prevent path parsing errors.
    - Encodes the video with hardsubs and returns the final MP4.

**Why this approach:**
-   **Zero Friction:** Users get a ready-to-publish video in one click.
-   **Robustness:** FFmpeg's subtitle renderer is battle-tested.
-   **No New Dependencies:** We already use FFmpeg on the server.

### 📊 Research Findings

**Technology Analysis:**
-   **Tool:** FFmpeg `subtitles` filter (libass).
-   **Performance:** Requires re-encoding the video stream (cannot use stream copy). This will take longer than the current cut/concat operations but is necessary for visual modification.
-   **Styling:** Supports basic styling via `force_style` parameter.

**Competitive Analysis:**
-   **Descript:** Built-in dynamic captions (fancy).
-   **Opus Clip:** Built-in AI captions (fancy).
-   **Our App:** Currently missing burned-in captions, making it a two-step process for users.

### 🧪 Proof of Concept

**Implementation:**
A POC script (`research/pocs/burned_subtitles_poc.js`) was created to verify the `subtitles` filter via Node.js `spawn`.

```javascript
const { spawn } = require('child_process');
const path = require('path');

async function burnSubtitles(videoPath, srtPath, outputPath) {
    // Escaping path is critical for ffmpeg subtitles filter
    const escapedSrtPath = path.resolve(srtPath).replace(/\\/g, '/').replace(/:/g, '\\:');

    const ffmpegArgs = [
        '-y',
        '-i', videoPath,
        '-vf', `subtitles=${escapedSrtPath}:force_style='FontSize=24,PrimaryColour=&H00FFFFFF,MarginV=20'`,
        '-c:a', 'copy',
        outputPath
    ];

    // ... spawn ffmpeg and resolve on close
}
```

**Performance:**
- Since it requires re-encoding, processing time depends on server CPU. For a 60-second clip, it might take 10-20 seconds on typical hardware.

### 📈 Value Proposition

**Benefits:**
-   ✅ **Ready to Publish:** Highlights can be directly uploaded to social media.
-   ✅ **Higher Engagement:** Videos with captions perform significantly better on social platforms.
-   ✅ **Workflow Simplification:** Removes dependency on external tools.

**User stories:**
-   As a **Creator**, I want to **download a video with subtitles already on it** so that **I can post it immediately to TikTok.**

### ⚖️ Trade-offs

**Pros:**
-   ✅ Extremely high user value.
-   ✅ Uses existing FFmpeg infrastructure.

**Cons:**
-   ❌ **Performance:** Requires video re-encoding, increasing server load and wait time compared to the current `stream copy` approach.

### 🛠️ Implementation Plan

**Phase 1: Backend Update** (estimated: 2 days)
-   [ ] Update `ffmpeg-service` to accept subtitle text payload.
-   [ ] Apply the `-vf subtitles=...` filter. Handle path escaping correctly.

**Phase 2: Frontend Integration** (estimated: 2 days)
-   [ ] Add "Burn Subtitles" toggle to the Export dialog.
-   [ ] Generate and pass the SRT string to the export API call.

**Total estimated effort:** 4 developer-days

**Dependencies:**
-   No new npm dependencies. Relies on FFmpeg having `libass` enabled.

### 🎬 Next Steps

**If approved:**
1.  Implement a new endpoint `POST /export-hardsub` in `ffmpeg-service`.
2.  Update the frontend to allow triggering this new export mode.