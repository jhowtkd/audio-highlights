## 🔬 Researcher: Server-Side Subtitle Burn-In (Hardsubbing)

### 🎯 Executive Summary
I propose adding a new feature to the `ffmpeg-service` microservice to automatically burn exported subtitles (SRT/VTT) directly into video highlights (Hardsubbing). This allows creators to download ready-to-publish, accessible video clips for social media without needing external video editing software to overlay text.

### 💡 Problem Statement
**Current situation:**
Currently, users can generate highlights, export a raw video clip, and download a separate `.srt` or `.vtt` file.

**User impact:**
To post a video to platforms like Instagram Reels, TikTok, or YouTube Shorts with burned-in subtitles (a standard best practice for engagement and accessibility), the user must download the raw video and the subtitle file, open a third-party editor (like Premiere, CapCut, or Final Cut), sync them, and re-export. This breaks the "all-in-one" workflow promise.

**Example scenario:**
A creator generates a 30-second viral clip. They want to post it immediately from their phone. They can download the `.mp4` and `.srt` but cannot combine them on mobile easily. They abandon the process or post without subtitles, hurting engagement.

### 🚀 Proposed Solution
**What:**
Enhance the `ffmpeg-service` with a new endpoint `POST /burn-subtitles` that accepts a video file and subtitle text (SRT/VTT format), and returns a video with the subtitles permanently burned into the frames.
Add a frontend option in the Highlight Card: "Download Video with Subtitles".

**How it works:**
1.  **Frontend:** Sends the raw video clip (or a request to process a specific segment) along with the generated `.srt` text to the `ffmpeg-service`.
2.  **Backend (`ffmpeg-service`):**
    - Saves the video and the `.srt` text to temporary files.
    - Uses FFmpeg's `subtitles` filter (`-vf subtitles=file.srt`).
    - *Crucial Technical Detail:* Applying video filters requires re-encoding the video stream (`-c:v libx264`). We cannot use stream copy (`-c copy`) for this step.
    - Returns the burned-in `.mp4`.

**Why this approach:**
-   **Zero Client-Side Load:** Video re-encoding is heavy. Offloading to the existing FFmpeg microservice ensures the browser doesn't freeze or crash.
-   **Standardization:** FFmpeg's libass-based subtitle renderer provides robust and reliable text rendering.
-   **High Value:** Directly solves a major friction point in the creator workflow.

### 📊 Research Findings

**Technology Analysis:**
-   **Library:** `ffmpeg-static` (currently used in `ffmpeg-service`).
-   **Requirement:** The FFmpeg binary must be compiled with `--enable-libass` to use the `subtitles` filter. The `ffmpeg-static` package (v5.3.0) used in this project *does* include this flag, making it compatible out-of-the-box.
-   **Filter:** `-vf subtitles=filename.srt`
-   **Performance Impact:** Re-encoding is slower than stream copying. A 60-second clip might take 5-15 seconds depending on server CPU, which is acceptable for an export step.

**Competitive Analysis:**
-   **Opus Clip / Munch / Veed:** Automatic, styled subtitle burn-in is their primary feature.
-   **Descript:** Supports exporting video with subtitles burned in.
-   **Our App (Current):** Requires manual combination in external tools.

### 🧪 Proof of Concept

**Implementation:**
A POC script (`research/pocs/hardsubbing-poc.js`) was written to verify that the `subtitles` filter works correctly in a Node environment using `spawn`.

```javascript
// research/pocs/hardsubbing-poc.js
const { spawn } = require('child_process');

async function burnSubtitles(videoPath, srtPath, outputPath) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-i', videoPath,
            '-vf', `subtitles=${srtPath}`,
            '-c:v', 'libx264', // Must re-encode video
            '-preset', 'fast',
            '-c:a', 'copy',    // Audio can still be copied
            outputPath
        ]);
        // ... handle resolution
    });
}
```

### 📈 Value Proposition

**Benefits:**
-   ✅ **Complete Workflow:** Users can go from long audio to a ready-to-publish social media clip in one tool.
-   ✅ **Increased Engagement:** Videos with subtitles perform significantly better on social platforms.
-   ✅ **Accessibility:** Ensures exported clips are accessible by default.

**User stories:**
-   As a **Social Media Manager**, I want to **download a video with subtitles already attached** so I can **post it directly to TikTok without opening an editor.**

### ⚖️ Trade-offs

**Pros:**
-   ✅ Massive UX improvement for the target audience.
-   ✅ Uses existing FFmpeg infrastructure.

**Cons:**
-   ❌ **Server Load:** Re-encoding video is CPU intensive and will increase the computational cost of the `ffmpeg-service`.
-   ❌ **Export Time:** It will take longer to download a hardsubbed video compared to a raw cut.
-   ❌ **Styling Limitations:** Basic FFmpeg SRT rendering isn't as flashy as TikTok's native dynamic captions (though ASS format could offer more styling in the future).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side WASM FFmpeg | Saves server costs | Extremely slow, high memory, frequent crashes on mobile | Rejected |
| HTML5 Canvas Recording | Can use CSS for fancy subtitle styling | Fragile, requires playing the video in real-time to record | Rejected |

### 🛠️ Implementation Plan

**Phase 1: Backend (`ffmpeg-service`)** (estimated: 2 days)
-   [ ] Add `POST /burn-subtitles` endpoint.
-   [ ] Implement logic to accept video upload (or existing temp path) and subtitle text payload.
-   [ ] Write temporary files and execute FFmpeg with `-vf subtitles` and `-c:v libx264`.
-   [ ] Stream the result back and clean up temp files.

**Phase 2: Frontend Integration** (estimated: 1.5 days)
-   [ ] Add a "Download with Subtitles" button next to the regular video download button in `HighlightList`.
-   [ ] Update the `handleDownloadVideo` logic to optionally call the new `/burn-subtitles` endpoint, passing the `.srt` generated by the existing `generateSRT` utility.
-   [ ] Add a loading state (spinner) during the re-encoding process.

**Total estimated effort:** 3.5 developer-days

**Risks:**
-   ⚠️ **High CPU Usage:** Concurrent requests could overwhelm the server. *Mitigation:* Consider implementing a queue system in the microservice later if usage scales.
-   ⚠️ **Font Rendering Issues:** FFmpeg might fallback to ugly default fonts if specific fonts aren't available in the server's OS environment. *Mitigation:* Ensure standard fonts (like Arial or Roboto) are available in the Docker container, or bundle a font file and use the `fontsdir` option in the subtitles filter.

### 📚 Resources

**Documentation:**
-   [FFmpeg Subtitles Filter](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

### 🎬 Next Steps

**If approved:**
1.  Begin Phase 1 by implementing and testing the `/burn-subtitles` endpoint in the `ffmpeg-service`.
