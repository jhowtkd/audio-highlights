## 🔬 Researcher: Server-Side Burned-In Subtitles for Video Export

### 🎯 Executive Summary
This proposal recommends adding a feature to the `ffmpeg-service` microservice to automatically burn generated SRT subtitles directly into the exported MP4 video clips (hardsubs). This eliminates the need for creators to use secondary software (like Premiere or CapCut) to add subtitles to their viral clips, significantly streamlining the workflow from raw podcast to ready-to-publish social media content.

### 💡 Problem Statement
**Current situation:**
AudioHighlights currently generates excellent highlights and allows users to export the video clip (via FFmpeg `cut` or `concat`) AND download the `.srt` subtitle file separately.

**User impact:**
- **Friction in publishing:** Users must take the raw `.mp4` and the `.srt` file into a video editor to render a final video with subtitles, which is a required format for TikTok/Reels/Shorts.
- **Time wasted:** This extra step defeats the purpose of an "automated AI clipper."

**Example scenario:**
A user generates a 45-second viral highlight. They click "Baixar Clip" and get `clip_123.mp4`. They click "SRT" and get `clip_123.srt`. They then have to open CapCut, import both, align them, and render a new video before posting to Instagram.

### 🚀 Proposed Solution
**What:**
Enhance the `ffmpeg-service` to accept subtitle text (or an SRT file) along with the video file during the `/cut-video` and `/concat-segments` requests. The server will use FFmpeg's `subtitles` filter to burn the text directly into the video stream.

**How it works:**
1.  **Frontend:** When requesting a video download, the client sends the `GeneratedHighlight.transcript` or generated SRT string in the `FormData`.
2.  **Backend (`ffmpeg-service`):**
    - The server temporarily saves the SRT string to a `.srt` file.
    - Instead of `-c copy` (stream copy), the server uses the `subtitles` video filter (`-vf subtitles=...`).
    - The server encodes the video (e.g., `-c:v libx264`) and returns the final hardsubbed `.mp4`.

**Why this approach:**
Burning subtitles server-side ensures the user gets a "ready-to-post" asset. While it requires re-encoding the video (losing the speed of `-c copy`), the trade-off is worth it for the massive UX improvement. We can offer this as an *option* (e.g., "Download with Subtitles" vs "Download Raw").

### 📊 Research Findings

**Technology Analysis:**
- **Library:** FFmpeg (`subtitles` filter).
- **Dependency:** Requires `libass` compiled into FFmpeg (standard in most Docker images, including the one likely used on Railway).
- **Performance impact:** Re-encoding is slower than stream copy. A 60-second clip might take 5-15 seconds to encode depending on server CPU, vs <1 second for stream copy.

**Competitive Analysis:**
- **OpusClip / Munch / Vizard:** All provide burned-in, highly stylized subtitles by default. It is the industry standard for AI clippers.

**Best Practices:**
-   **Path Escaping:** FFmpeg's subtitle filter is notoriously strict about Windows/absolute paths. The path must be escaped properly (e.g., `.replace(/\\/g, '/').replace(/:/g, '\\:')`).
-   **Styling:** We can provide a basic default style using the `force_style` parameter in FFmpeg (e.g., Arial, yellow text, black outline).

### 🧪 Proof of Concept

**Implementation:**
A script `research/pocs/burned-subtitles-poc.js` was created to validate the FFmpeg command syntax for the Node.js environment.

```javascript
const { spawn } = require('child_process');
const path = require('path');

// ... (setup temp files)
const escapedSrtPath = path.resolve(srtPath).replace(/\\/g, '/').replace(/:/g, '\\:');

const ffmpegArgs = [
    '-y',
    '-i', videoPath,
    '-vf', `subtitles='${escapedSrtPath}':force_style='Fontname=Arial,Fontsize=24,PrimaryColour=&H00FFFF,Outline=1'`,
    '-c:a', 'copy',
    outputPath
];

const ffmpeg = spawn('ffmpeg', ffmpegArgs);
```

### 📈 Value Proposition

**Benefits:**
- ✅ **Complete Workflow:** Users can go from long podcast to publishable TikTok without leaving the browser.
- ✅ **Higher Retention:** Creators are more likely to use the tool if it saves them the CapCut step.

**User stories:**
- As a creator, I want my downloaded clips to already have subtitles so I can post them immediately from my phone.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massive competitive parity with tools like OpusClip.
- ✅ Uses existing infrastructure (FFmpeg service).

**Cons:**
- ❌ **Slower Export:** Requires re-encoding, meaning the user waits longer for the download.
- ❌ **Higher Server Load:** Encoding takes significantly more CPU than stream copying.
- ❌ **Basic Styling:** FFmpeg subtitles are basic compared to dynamic HTML/CSS animations.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Client-side WebCodecs/Canvas** | Zero server cost | Extremely complex to implement, slow on low-end devices | Rejected for now. |

### 🛠️ Implementation Plan

**Phase 1: FFmpeg Service Update** (estimated: 2 days)
- [ ] Add `subtitles` (string) to `/cut-video` request body.
- [ ] Write temporary `.srt` file.
- [ ] Update spawn arguments to include `-vf subtitles=...` and `-c:v libx264` when subtitles are requested.
- [ ] Add error handling and cleanup for the `.srt` file.

**Phase 2: Frontend Integration** (estimated: 1 day)
- [ ] Update `use-ffmpeg.ts` `cutVideo` to accept `srtContent` and append to `FormData`.
- [ ] Update `HighlightCard` download buttons to offer "Baixar Vídeo (Sem Legenda)" and "Baixar Vídeo (Com Legenda)".
- [ ] Generate SRT string on the fly using existing `generateSRT` util.

**Phase 3: Mix Mode Support** (estimated: 1 day)
- [ ] Apply the same logic to the `/concat-segments` endpoint.

**Total estimated effort:** 4 developer-days

### 🎬 Next Steps

**If approved:**
1. Update `ffmpeg-service/src/index.ts` to handle the new `subtitles` field.
2. Deploy the updated service to test encoding performance.
