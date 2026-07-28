## 🔬 Researcher: Server-Side Burned Subtitles API

### 🎯 Executive Summary
Proposing the addition of an endpoint to the `ffmpeg-service` microservice to burn subtitles (SRT/VTT) directly into video files. This adds immense value by allowing users to export ready-to-publish, subtitled highlight clips for social media directly from the application.

### 💡 Problem Statement
**Current situation:**
Currently, users can trim videos and download transcripts (SRT/VTT) separately. If they want to post a video with subtitles to social media platforms (TikTok, Instagram Reels, LinkedIn), they have to use external software (like Premiere, CapCut, or Descript) to burn the subtitles into the video.

**User impact:**
Users creating viral clips or highlights must leave the application to finalize their workflow. This breaks the seamless experience of an all-in-one AI highlight generator.

**Example scenario:**
A user generates a 60-second viral clip using the application. To share it on LinkedIn, they must download the `clip.mp4` and `clip.srt`, import them into CapCut, sync them, render the video again, and then upload it.

### 🚀 Proposed Solution
**What:**
Add a new endpoint `POST /burn-subtitles` to the Express `ffmpeg-service` backend. This endpoint accepts a video file and an SRT/VTT file (or subtitle text in the body), and returns the video with hardcoded subtitles.

**How it works:**
The endpoint will utilize `multer` to accept the video and subtitle files. It will then use `spawn` to run FFmpeg with the `subtitles` video filter (`-vf subtitles=file.srt`). Finally, it will stream or return the processed file back to the client and clean up the temporary files using `fs.unlink()`.

**Why this approach:**
- **Performance & Reliability:** FFmpeg's `subtitles` filter is the industry standard for hardcoding subtitles. Running this server-side is far more reliable and faster than trying to do this client-side with WASM FFmpeg, especially for longer clips or higher resolutions.
- **Integration:** The project already has a dedicated `ffmpeg-service` microservice handling `/cut-video` and `/concat-segments`, making this the natural and architectural place for this feature.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg (`subtitles` filter) via Node.js `child_process.spawn`.
- **Maturity:** Highly stable.
- **Adoption:** Universal standard for video processing.
- **Gotchas:** The absolute path to the subtitle file in the `-vf subtitles=...` argument must have backslashes replaced with forward slashes and colons escaped (`\\.`), or it will fail to parse on some systems (notably Windows, but good practice everywhere).

**Competitive Analysis:**
- OpusClip: Provides videos with burned-in, styled subtitles.
- Descript: Allows exporting videos with burned-in subtitles.
- Our App: Currently only provides separate SRT/VTT files.

### 🧪 Proof of Concept

**Implementation:**
Tested locally with `ffmpeg-static` via Node.js.
```javascript
const { spawn } = require('child_process');
const fs = require('fs');

const escapedSubsFile = subsFile.replace(/\\/g, '/').replace(/:/g, '\\\\:');

const ffmpeg = spawn(ffmpegPath, [
  '-y',
  '-i', inputVideo,
  '-vf', `subtitles=${escapedSubsFile}:force_style='Fontsize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=20'`,
  outputVideo
]);
```

**Performance:**
- Rendering time scales approximately 0.5x - 1x real-time depending on server CPU and video resolution. Since highlight clips are typically short (30-60s), processing will take ~15-30 seconds, which is acceptable for a final export.

### 📈 Value Proposition

**Benefits:**
- ✅ **End-to-End Workflow:** Users can generate a clip and export a social-media-ready video without leaving the app.
- ✅ **Higher Retention:** Prevents users from relying on competitors' tools to finish their workflow.

**User stories:**
- As a content creator, I can download a video with subtitles already on it so that I can immediately upload it to TikTok.

### ⚖️ Trade-offs

**Pros:**
- ✅ Leverages existing infrastructure (`ffmpeg-service`).
- ✅ Massive UX improvement.

**Cons:**
- ❌ Re-encoding the video is required to burn subtitles, which takes CPU time and degrades quality slightly compared to stream copying (`-c copy`).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side FFmpeg WASM | Zero server cost | Extremely slow, crashes browser on large files | Not chosen because server-side FFmpeg is already established and much faster. |

### 🛠️ Implementation Plan

**Phase 1: Backend Implementation** (estimated: 1 day)
- [ ] Add `POST /burn-subtitles` to `ffmpeg-service/src/index.ts`.
- [ ] Implement `multer` for multiple file uploads or file + text fields.
- [ ] Implement FFmpeg `spawn` with the `subtitles` filter and proper path escaping.
- [ ] Ensure strict cleanup (`fs.unlink`) of all temporary files in both success and error paths.

**Phase 2: Frontend Integration** (estimated: 1 day)
- [ ] Add "Export with Subtitles" button to the `HighlightCard` component.
- [ ] Hook up API call to the new service endpoint.

**Total estimated effort:** 2 developer-days

**Risks:**
- ⚠️ **Server Load:** Re-encoding is CPU-heavy. - Mitigation: The service already has a rate limiter (100 req/15min).

### 📚 Resources

**Documentation:**
- [FFmpeg Subtitles Filter Docs](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

### 🎬 Next Steps

**If approved:**
1. Implement the endpoint in `ffmpeg-service`.
2. Add frontend UI for the export option.

**Questions to resolve:**
- [ ] What is the maximum acceptable video length for synchronous processing before we need to move to a webhook/async pattern?
- [ ] Should we allow the user to customize the subtitle styling via the frontend, or stick to a default aesthetic?

### 💬 Discussion Points
- Considering the CPU cost of re-encoding, should we restrict this feature to premium users or specific clip lengths?
- Is there a way to leverage hardware acceleration (e.g., NVENC or QuickSync) on the Railway deployment to speed up the FFmpeg `subtitles` filter?
