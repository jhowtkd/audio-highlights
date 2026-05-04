## 🔬 Researcher: Subtitle Burn-in for Video Exports

### 🎯 Executive Summary
Currently, users can generate and download subtitles (.srt/.vtt) separately from their video clips. I propose adding an option to automatically "burn-in" (hardcode) subtitles directly into the exported video clips using the existing server-side FFmpeg microservice. This eliminates the need for users to manually combine video and subtitles in a separate editing tool, directly addressing a common pain point for social media content creators.

### 💡 Problem Statement
**Current situation:**
AudioHighlights generates great video clips and accurate subtitles, but users must download them as separate files. To post a video with subtitles on platforms like Instagram, TikTok, or LinkedIn, users have to import both the video and the subtitle file into a third-party editor (like Premiere, CapCut, or DaVinci Resolve) to render a final video with burned-in text.

**User impact:**
Social media managers and creators, our primary target audience, spend extra time on a tedious secondary editing step. Many social platforms (like Instagram Reels) don't natively support uploading separate `.srt` files alongside the video during posting; the text must be part of the video stream.

**Example scenario:**
A user generates a 60-second highlight of a podcast. They download `clip.mp4` and `clip.srt`. To post this to Instagram, they must open CapCut on their phone, import `clip.mp4`, import `clip.srt`, adjust the styling, and export a new video. This breaks the seamless flow of the application.

### 🚀 Proposed Solution
**What:**
Add a "Burn-in Subtitles" toggle to the export dialog for video highlights. When enabled, the application will send the video and the corresponding subtitle text to the server-side FFmpeg service, which will use the `subtitles` filter to render the text directly onto the video frames before returning the final file to the user.

**How it works:**
1.  **Frontend:** Update the `HighlightCard` export options to include a "Video with Subtitles (Hardsub)" button or toggle.
2.  **API:** When the user requests a hardsubbed video, the frontend will either:
    *   Send the video blob and the SRT string to a new `/burn-subtitles` endpoint on the `ffmpeg-service`.
    *   Or, integrate the SRT generation into the existing `/cut-video` or `/concat-segments` endpoints by passing the transcript segments.
3.  **FFmpeg Service:** The Node.js service will save the SRT string to a temporary file (`temp.srt`). It will then execute an FFmpeg command using the `subtitles` filter: `ffmpeg -i input.mp4 -vf subtitles=temp.srt -c:a copy output.mp4`.
4.  **Result:** The user downloads a single MP4 file ready for upload to any social network.

**Why this approach:**
-   **Leverages Existing Infrastructure:** We already have an `ffmpeg-service` running on Railway specifically for video processing. Adding the `subtitles` filter is a natural extension.
-   **Performance:** The `ffmpeg-static` library we use in POC includes the `--enable-libass` flag, which is required for the `subtitles` filter.
-   **No Client-side Overhead:** Video encoding with hardsubs is computationally expensive. Doing this client-side via WASM FFmpeg would be extremely slow and drain battery. Server-side processing is the correct architectural choice.

### 📊 Research Findings

**Technology Analysis:**
-   **Library/Framework:** FFmpeg (`fluent-ffmpeg` and `ffmpeg-static` in Node.js)
-   **Filter:** `subtitles` (requires `libass`)
-   **Maturity:** Highly stable. This is the industry standard way to hardsub videos.
-   **Bundle size:** No impact on the frontend bundle size.
-   **Compatibility:** Verified that the current version of `ffmpeg-static` used in the ecosystem supports `libass` (see POC).

**Competitive Analysis:**
-   **Opus Clip / Munch / Veed.io:** All major competitors provide videos with burned-in subtitles by default, as it's the primary use case for short-form video.
-   **Our App:** Currently requires manual assembly.

**Best Practices:**
-   Use ASS (Advanced SubStation Alpha) format instead of SRT if advanced styling (fonts, colors, background boxes) is needed in the future. For V1, standard SRT is sufficient.
-   Ensure absolute paths are used for the subtitle file in the FFmpeg command and escape special characters to prevent path resolution errors.

### 🧪 Proof of Concept

**Implementation:**
A local Node script was created to verify that `ffmpeg-static` can handle the `subtitles` filter.

```javascript
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const execSync = require('child_process').execSync;
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegStatic);

// Setup dummy video and SRT
execSync(`${ffmpegStatic} -f lavfi -i color=c=blue:s=320x240:d=5 -y research/pocs/test.mp4`);
fs.writeFileSync('research/pocs/test.srt', `1\n00:00:01,000 --> 00:00:04,000\nHello World! This is a test subtitle.\n`);

const srtPath = path.resolve('research/pocs/test.srt');
// Escape paths for FFmpeg filter syntax
const escapedSrtPath = srtPath.replace(/\\\\/g, '\\\\\\\\').replace(/:/g, '\\\\:');

try {
  execSync(`${ffmpegStatic} -i research/pocs/test.mp4 -vf subtitles=${escapedSrtPath} -c:a copy -y research/pocs/output.mp4`);
  console.log('Success! Output generated at research/pocs/output.mp4');
} catch (e) {
  console.error('Failed', e.message);
}
```

**Performance:**
-   Video encoding speed depends on the server specs, but using `libx264` with a fast preset (`-preset fast`) provides a good balance between speed and quality for short clips. Audio is stream-copied (`-c:a copy`) to save time.

### 📈 Value Proposition

**Benefits:**
-   ✅ **Saves User Time:** Eliminates the need for a third-party editor.
-   ✅ **Ready-to-Post Content:** Outputs files that can be directly uploaded to TikTok, Instagram Reels, and YouTube Shorts.
-   ✅ **Competitive Parity:** Brings the app up to speed with industry standards for AI clipping tools.

**User stories:**
-   As a podcaster, I can download a highlight video with the subtitles already burned in, so that I can immediately post it to Instagram Reels without opening CapCut.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Massive UX improvement for the primary use case.
-   ✅ Uses existing server-side architecture.

**Cons:**
-   ❌ Increases server load. Video re-encoding is more CPU intensive than simple cutting (`stream copy`).
-   ❌ Slower export times for the user compared to a simple cut, as the video must be re-encoded.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side WASM FFmpeg | Zero server cost. | Extremely slow, high memory usage, prone to crashing the browser tab. | Not chosen because the UX of waiting 5+ minutes for a 1-minute clip is unacceptable. |
| Browser Canvas Recording | Can render React components over video and record the canvas stream. | Quality issues, A/V sync problems, requires playing the video in real-time to export. | Not chosen because it's hacky and unreliable for final exports. |

### 🛠️ Implementation Plan

**Phase 1: Foundation (Server-side)** (estimated: 1 day)
-   [ ] Update `ffmpeg-service` to accept a subtitle payload (either a file or a string) alongside the video file.
-   [ ] Create a new endpoint `/burn-subtitles` or modify `/cut-video` to accept an optional `srtContent` parameter.
-   [ ] Implement the FFmpeg logic to save the temp SRT and run the `subtitles` filter command.

**Phase 2: Core Feature (Client-side)** (estimated: 1 day)
-   [ ] Update `use-ffmpeg.ts` hook to add a `burnSubtitles` function that calls the new service endpoint.
-   [ ] Modify the `HighlightCard` component export menu to add an "Export Video with Subtitles" option.
-   [ ] Generate the SRT string on the fly using existing utilities (`generateSRT`) and pass it to the hook.

**Phase 3: Polish & Testing** (estimated: 1 day)
-   [ ] Add progress indicators for the longer export process.
-   [ ] Test with various video formats, aspect ratios, and special characters in subtitles.
-   [ ] Ensure temporary files are correctly cleaned up on the server.

**Total estimated effort:** 3 developer-days

**Dependencies:**
-   Requires changes to the external `ffmpeg-service` repository/deployment.

**Risks:**
-   ⚠️ **Server Timeout:** Encoding a 3-minute video with subtitles might exceed standard HTTP request timeouts (e.g., Vercel's 60s limit, though the service is on Railway).
    -   *Mitigation:* Ensure Railway service timeouts are configured appropriately, or consider a polling/webhook architecture for long jobs in the future.
-   ⚠️ **Font Rendering:** Default fonts might look plain or be hard to read against certain backgrounds.
    -   *Mitigation:* Use ASS format instead of SRT in future iterations to allow for styling (outline, shadow, bold fonts).

### 🎬 Next Steps

**If approved:**
1.  Discuss server load implications and timeout settings for the `ffmpeg-service` on Railway.
2.  Begin implementation of the server-side endpoint.
3.  Draft PR for frontend integration.

**Questions to resolve:**
- [ ] What is the maximum acceptable wait time for a user exporting a hardsubbed video?
- [ ] Should we support ASS format immediately for basic styling, or start with SRT only?

### 📚 Resources

**Documentation:**
- [FFmpeg Subtitles Filter Documentation](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)
- [fluent-ffmpeg Documentation](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)

**Examples:**
- [Local Proof of Concept (see above)](#-proof-of-concept)

**Community:**
- [FFmpeg Discord Community](https://discord.gg/ffmpeg)

### 💬 Discussion Points
- Given the increased server load for video re-encoding, should this feature be restricted to a premium tier in the future?
- What are the timeout limits for the `ffmpeg-service` on Railway, and will they accommodate encoding 4-minute clips with hardsubs?
