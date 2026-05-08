## 🔬 Researcher: Hardcoded Subtitles for Mix Videos

### 🎯 Executive Summary
Propose adding a feature to automatically burn-in (hardcode) subtitles into the generated "Mix Mode" videos. This solves a major pain point for content creators who need ready-to-publish viral clips with baked-in captions, eliminating the need for external video editing software to overlay the exported SRT file.

### 💡 Problem Statement
**Current situation:**
Currently, users can generate a "Mix" video (concatenated clips) and export an SRT file with the transcript. However, they must use an external tool (like Premiere Pro, CapCut, or another service) to combine the SRT with the MP4 to create the final captioned video.

**User impact:**
- Significant friction and time added to the workflow.
- High drop-off rate or frustration from users expecting an "all-in-one" clip generator.

**Example scenario:**
A podcaster generates a 60-second highlight reel. They download the MP4 and the SRT. To post this on Instagram Reels or TikTok, they have to import both into CapCut, align them, and export again.

### 🚀 Proposed Solution
**What:**
Enhance the `ffmpeg-service` and frontend to support a "Burn Subtitles" option during Mix Mode generation. When selected, the server will take the compiled video and use FFmpeg to hardcode the subtitles directly onto the video frames.

**How it works:**
1.  **Frontend:** Passes the combined SRT content (or transcript data) to the `ffmpeg-service` along with the video segments.
2.  **ffmpeg-service:**
    - Saves the SRT content to a temporary file.
    - Uses the FFmpeg `subtitles` filter to burn the SRT onto the video during the concatenation/encoding process.
    - Returns the final captioned video to the client.

**Why this approach:**
- Keeps the user entirely within the application.
- Server-side processing avoids the immense complexity and performance limitations of trying to render video with subtitles in the browser (e.g., via Canvas and MediaRecorder).

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg `subtitles` filter.
- **Maturity:** Highly mature and stable.
- **Performance:** Requires video re-encoding (cannot use stream copy `-c:v copy`). This means processing will take longer depending on server CPU and video length.
- **Customization:** The `subtitles` filter allows styling via standard ASS/SSA styles or specific filter parameters (e.g., font, size, color, background).

**Competitive Analysis:**
- **OpusClip / Munch:** These tools provide highly stylized, dynamic hardcoded subtitles out-of-the-box. It is their core value proposition.
- **Our App:** Adding basic burned-in subtitles brings us much closer to parity with these tools.

### 🧪 Proof of Concept

**Implementation:**
A POC was written in Node.js to verify the FFmpeg `subtitles` filter capabilities using `ffmpeg-static`.

```javascript
// From research/pocs/subtitles-poc.js
function burnSubtitles(videoFile, srtFile, outputFile) {
    // Crucial: Escaping path for FFmpeg filter syntax
    const escapedSrtPath = srtFile.replace(/\\/g, '\\\\').replace(/:/g, '\\:');

    const args = [
        '-y',
        '-i', videoFile,
        '-vf', `subtitles=${escapedSrtPath}:force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2'`,
        '-c:a', 'copy',
        '-c:v', 'libx264', // Must re-encode
        outputFile
    ];
    // spawn ffmpeg...
}
```

**Demo:**
The POC successfully generated a 5-second video with the provided SRT burned in. The process required re-encoding but completed in < 2 seconds for the short clip.

**Performance:**
- Re-encoding is the bottleneck. For a 1-minute 1080p clip on a typical server, it may take 5-15 seconds. This is acceptable for a "Generate Final Video" step.

### 📈 Value Proposition

**Benefits:**
- ✅ **Ready to Publish:** Users get a final video they can upload immediately.
- ✅ **Increased Retention:** Users don't need to leave the app to finish their work.
- ✅ **Higher Value:** Makes the tool significantly more useful for social media managers.

**User stories:**
- As a **Social Media Manager**, I want to **download a video with subtitles already on it** so that I can **upload it straight to TikTok without extra editing.**

### ⚖️ Trade-offs

**Pros:**
- ✅ Massively improves user experience for clip generation.
- ✅ FFmpeg handles text rendering and alignment automatically based on the SRT.

**Cons:**
- ❌ **Slower Generation:** Requires full video re-encoding (`-c:v libx264`), which is much slower than the current stream copy approach.
- ❌ **Server Load:** Increases CPU usage on the `ffmpeg-service`.
- ❌ **Limited Styling initially:** Basic SRT styling is simple, but dynamic Word-by-Word highlighting (like OpusClip) requires complex ASS formats or specialized tools.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side Canvas rendering | Zero server cost | Extremely slow, buggy, requires MediaRecorder | Not chosen |
| Export SRT only | Fast, cheap | High user friction | Current state, need to upgrade |

### 🛠️ Implementation Plan

**Phase 1: ffmpeg-service Update** (estimated: 2 days)
- [ ] Add ability to accept SRT content in the `/concat-segments` and `/cut-video` endpoints.
- [ ] Write SRT content to a temporary file.
- [ ] Modify FFmpeg commands to conditionally apply the `-vf subtitles=temp.srt` filter and force `-c:v libx264`.

**Phase 2: Frontend Integration** (estimated: 1 day)
- [ ] Add a "Burn Subtitles" toggle in the Mix/Export UI.
- [ ] Generate the SRT string for the selected segments and send it in the payload to the service.

**Total estimated effort:** 3 developer-days

**Risks:**
- ⚠️ **Server Timeout:** If the generated clip is long, the HTTP request might timeout during re-encoding.
  - *Mitigation:* Limit Mix duration or implement a polling/webhook architecture for long jobs.
- ⚠️ **Path escaping issues:** FFmpeg filter syntax is notoriously picky about paths.
  - *Mitigation:* Ensure robust path escaping in the service, or run FFmpeg in the same directory as the temp files.

### 📚 Resources

**Documentation:**
- [FFmpeg Subtitles Filter](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

### 🎬 Next Steps

**If approved:**
1. Update `ffmpeg-service` `index.ts` to accept an optional `srtData` field in the request body.
2. Implement temp file creation and cleanup for the SRT in the service.
3. Update the FFmpeg command generation logic.

**Questions to resolve:**
- [ ] How should we handle custom font requirements for user brands?
- [ ] What is the maximum acceptable latency for generation before we need a background worker approach instead of HTTP response?

### 💬 Discussion Points
- Should we provide standard styling templates (e.g., "Munch style", "TikTok style") or just one default?
- Do we need to enforce a maximum video length when using Burn Subtitles to avoid server timeouts?
