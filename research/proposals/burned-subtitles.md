## 🔬 Researcher: Burned Subtitles

### 🎯 Executive Summary
I propose adding a "Burned Subtitles" (Hardsubs) feature to the video export process. This will allow users to export video clips with their generated transcripts visually embedded directly into the video frames, making them perfect for social media sharing.

### 💡 Problem Statement
**Current situation:**
Currently, users can generate transcripts and export them as standalone SRT or Markdown files, or cut video clips. However, they cannot automatically combine the two to create ready-to-publish social media clips with on-screen text.

**User impact:**
Content creators have to use a third-party tool (like Premiere, CapCut, or Descript) to import the video and the SRT file just to render subtitles on screen.

**Example scenario:**
A user extracts a 30-second viral highlight. They want to post it to Instagram Reels or TikTok immediately. Without burned subtitles, engagement will be low, so they must leave the app to add text elsewhere.

### 🚀 Proposed Solution
**What:**
Introduce a new endpoint in `ffmpeg-service` (e.g., `/burn-subtitles`) that accepts a video file and an SRT file (or subtitle data) and uses FFmpeg to hard-code the subtitles into the video stream.

**How it works:**
1. The frontend generates an SRT file from the selected transcript segment.
2. The frontend sends the video file and SRT data to `ffmpeg-service`.
3. The server saves the SRT file temporarily.
4. FFmpeg is spawned using the `subtitles` video filter (`-vf subtitles=...`). The absolute path to the SRT file must be escaped properly (e.g., `.replace(/\\/g, '/').replace(/:/g, '\\:')`).
5. The processed video is streamed back to the client.

**Why this approach:**
- **Native capability:** We already have an FFmpeg microservice running; adding a video filter is a natural extension.
- **Server-side processing:** Prevents the client from having to re-encode video in the browser via WASM, which is extremely slow for video filters.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Native FFmpeg (`subtitles` filter).
- **Maturity:** Highly stable and battle-tested.
- **Dependencies:** FFmpeg must be compiled with `--enable-libass` (which is standard in most builds).

**Competitive Analysis:**
- **OpusClip / Veed.io / Descript:** All feature automatic subtitle burning with various styling options. It is a table-stakes feature for short-form video tools.

**Best Practices:**
- Path escaping is critical for FFmpeg filters. Windows paths and colons can break the filter syntax.

### 🧪 Proof of Concept

**Implementation:**
```javascript
const { spawn } = require('child_process');
const path = require('path');

async function burnSubtitles(inputVideo, inputSrt, outputVideo) {
    // Important: Escape absolute paths for the subtitles filter
    const absoluteSrtPath = path.resolve(inputSrt).replace(/\\/g, '/').replace(/:/g, '\\:');

    const ffmpegArgs = [
        '-y',
        '-i', inputVideo,
        '-vf', `subtitles=${absoluteSrtPath}`,
        '-c:a', 'copy',
        outputVideo
    ];

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    // ... handle stream events
}
```
Available in `research/pocs/burned-subtitles-poc.js`.

**Demo:**
A script was written to demonstrate the FFmpeg filter syntax in Node.js.

### 📈 Value Proposition

**Benefits:**
- ✅ **All-in-one workflow:** Users can go from long video to ready-to-post short clip entirely within our app.
- ✅ **Increased value:** Significantly raises the utility of the tool for creators.

**User stories:**
- As a content creator, I want to export my highlight with on-screen text so I can immediately upload it to TikTok without external editing.

### ⚖️ Trade-offs

**Pros:**
- ✅ High user demand for this type of feature.
- ✅ Leverages existing FFmpeg infrastructure.

**Cons:**
- ❌ **Re-encoding required:** Unlike stream copy (`-c copy`), applying a video filter requires re-encoding the video (`libx264`), which consumes more CPU and time on the server.
- ❌ **Styling limitations:** Basic FFmpeg subtitles filter styling is less flexible than HTML/Canvas-based solutions unless using complex ASS subtitle files.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| WASM FFmpeg | Client-side, no server cost | Too slow for video re-encoding | Not chosen because video encoding in WASM is unacceptably slow. |
| Canvas drawing | Highly customizable | Requires complex MediaRecorder setup | Not chosen because it's error-prone and lowers export quality. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 days)
- [ ] Ensure FFmpeg service environment supports `libass`.
- [ ] Add `/burn-subtitles` endpoint to `ffmpeg-service`.

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Implement SRT generation and upload from the frontend.
- [ ] Create UI for "Export with Subtitles" button.

**Phase 3: Polish & Testing** (estimated: 1 days)
- [ ] Add basic styling options (font size, color) by generating ASS instead of SRT, or using FFmpeg `force_style`.
- [ ] Test with various video resolutions.

**Total estimated effort:** 4 developer-days

**Dependencies:**
- FFmpeg (server-side)

**Risks:**
- ⚠️ **Server Load:** Re-encoding video will increase Railway CPU usage. - Mitigation: Implement strict duration limits (e.g., max 60 seconds) for burned subtitle exports.

### 📚 Resources

**Documentation:**
- [FFmpeg Subtitles Filter](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

**Community:**
- Stack Overflow discussions on escaping paths for FFmpeg filters.

### 🎬 Next Steps

**If approved:**
1. Test FFmpeg re-encoding performance on Railway for 60s clips.
2. Draft the API contract for the new endpoint.

### 💬 Discussion Points
- Should we offer basic style customization (color/font) in V1, or just stick to a default readable style (white text, black outline)?