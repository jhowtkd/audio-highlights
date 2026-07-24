## 🔬 Researcher: Burned Subtitles (Hardsubs)

### 🎯 Executive Summary
I propose adding a **Burned Subtitles (Hardsubs)** feature to the `ffmpeg-service` microservice. This will allow users to directly burn generated subtitles into the exported video clips, saving them from having to use external tools for this critical workflow step, enhancing the app's value for content creators.

### 💡 Problem Statement
**Current situation:**
The application generates high-quality transcriptions and exports SRT/VTT files, but cannot embed these subtitles directly into the video output.

**User impact:**
Creators want ready-to-publish short-form videos. Having to download the video and the SRT separately, and then composite them in Premiere Pro, CapCut, or another tool adds significant friction.

**Example scenario:**
A user generates a viral highlight of a podcast. They want to upload it directly to TikTok, but they need stylized subtitles on the video. Currently, they must use a third-party application to do this.

### 🚀 Proposed Solution
**What:**
Add a `/burn-subtitles` endpoint to the `ffmpeg-service`. This will take a video file and an SRT/VTT file as input and output a new video with the subtitles permanently burned in (hardsubs).

**How it works:**
- **Ingestion:** The frontend sends the source video, the SRT file (or raw subtitle text to be converted), and style parameters to the backend.
- **Processing:** `ffmpeg-service` uses the FFmpeg `subtitles` video filter (`-vf subtitles=...`) to overlay the text onto the video stream.
- **Execution:** Since this modifies the video frames, re-encoding the video stream is required (stream copy cannot be used).

**Why this approach:**
- FFmpeg's `subtitles` filter is powerful and supports custom styling (fonts, colors, borders) using ASS formatting or inline style overrides.
- Leverages the existing `ffmpeg-service` infrastructure.

### 📊 Research Findings

**Technology Analysis:**
- **Tool:** FFmpeg.
- **Filter:** `subtitles`.
- **Performance:** Requires re-encoding, so it will be slower than the fast stream-copy clipping feature. It is computationally intensive.
- **Alternative:** `drawtext` filter. But `subtitles` is much easier when you already have an SRT file.

**Competitive Analysis:**
- **OpusClip, Munch, Veed.io:** Auto-captioning with customizable styles is a core, differentiating feature.

### 🧪 Proof of Concept

**Implementation:**
A script `burned-subtitles-poc.js` was created and run successfully using `ffmpeg-static`.

```javascript
const ffmpegCommand = require('ffmpeg-static');
const { spawn } = require('child_process');
const srtAbsolutePath = path.resolve('temp-subs.srt').replace(/\\/g, '/').replace(/:/g, '\\:');

const ff = spawn(ffmpegCommand, [
    '-i', 'input.mp4',
    '-vf', `subtitles=${srtAbsolutePath}:force_style='FontSize=48,PrimaryColour=&H00FFFF,BorderStyle=3'`,
    '-y', 'output.mp4'
]);
```

**Performance:**
It successfully burned subtitles onto a generated dummy video. Due to the need for re-encoding, processing time is roughly proportional to the clip duration and resolution, making it suitable for short highlights. Note: Windows/Path issues require escaping the path (`srtAbsolutePath`) for the `subtitles` filter.

### 📈 Value Proposition

**Benefits:**
- ✅ **End-to-End Workflow:** Users can go from long video to ready-to-post short form content entirely within the app.
- ✅ **Retention:** Reduces churn to other auto-captioning apps.

**User stories:**
- As a Creator, I want to export my highlight with burned-in subtitles so I can instantly upload it to Instagram Reels.

### ⚖️ Trade-offs

**Pros:**
- ✅ High-value feature.
- ✅ Uses existing `ffmpeg` dependency.

**Cons:**
- ❌ **Server Load:** Re-encoding video is CPU intensive and will significantly increase the load on the `ffmpeg-service`.
- ❌ **Speed:** Slower than the current "fast cut" stream copy implementation.

### 🛠️ Implementation Plan

**Phase 1: Backend Service** (estimated: 2 days)
- [ ] Add `POST /burn-subtitles` to `ffmpeg-service`.
- [ ] Implement file upload handling for video + SRT file.
- [ ] Implement the FFmpeg spawn command with the `subtitles` filter and path escaping.

**Phase 2: Frontend Integration** (estimated: 2 days)
- [ ] Add an "Export with Subtitles" option to the Highlight export menu.
- [ ] Generate the SRT file content on the client side and send it alongside the video clip to the new endpoint.

**Total estimated effort:** 4 developer-days

**Dependencies:**
- `ffmpeg-static` (existing in `ffmpeg-service`)

### 🎬 Next Steps

**If approved:**
1. Implement the endpoint in `ffmpeg-service`.
2. Design the frontend UI for subtitle export.
