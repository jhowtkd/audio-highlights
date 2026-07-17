## 🔬 Researcher: Server-Side Subtitle Burn-In for Highlights

### 🎯 Executive Summary
Enable users to automatically overlay ("burn-in") highly stylized subtitles directly onto the exported video highlights. This eliminates the need for users to manually add SRT files in external video editing software like Premiere or CapCut before posting to social media platforms.

### 💡 Problem Statement
**Current situation:**
The platform currently generates excellent highlights and provides SRT exports, but when users export the video clips themselves, they are raw without text.

**User impact:**
Content creators aiming for viral social media content (TikTok, Reels, Shorts) almost universally require captions for accessibility and engagement. Currently, they must download the video and the SRT separately, open an external editor, and render a new video just to add subtitles, breaking the "one-click publish" workflow.

**Example scenario:**
A podcaster uses AudioHighlights to find a great 45-second hot-take. They want to post it to TikTok immediately. Right now, they have to download `clip.mp4` and `clip.srt`, open CapCut, import both, style the text, and export again.

### 🚀 Proposed Solution
**What:**
Add an option to burn subtitles directly into the video file when exporting a highlight, leveraging our existing FFmpeg microservice.

**How it works:**
1.  **Frontend:** Add a toggle in the highlight export menu for "Export with Subtitles".
2.  **Frontend:** Generate the SRT content for the specific highlight.
3.  **FFmpeg Service:** Create a new endpoint `/cut-video-with-subtitles` (or modify `/cut-video`).
4.  **FFmpeg Service:** The service will receive the video, start/end times, and the SRT content. It will write the SRT to a temporary file.
5.  **FFmpeg Service:** Use the `subtitles` video filter (`-vf subtitles=temp.srt:force_style=...`) during the FFmpeg cut process to render the text onto the video frames.

**Why this approach:**
We already have a dedicated, server-side FFmpeg worker (railway) that handles video cutting because client-side WASM FFmpeg is too slow/unreliable for complex video tasks. Burning subtitles requires re-encoding the video stream (`libx264`), which is computationally heavy and thus perfectly suited for the backend service.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg (`subtitles` filter via `libass`)
- **Maturity:** Stable, industry standard for hardcoding subtitles.
- **Complexity:** Requires recompiling the video stream (unlike our current stream copy `-c copy` approach), which increases processing time.

**Competitive Analysis:**
- OpusClip / Munch: All provide burned-in, highly stylized dynamic captions by default.
- Descript: Allows exporting with burned-in captions.

**Best Practices:**
- Use `force_style` to ensure subtitles look modern (e.g., Arial/Roboto, yellow or white text, black outline, thick border, centered, slightly above the bottom edge).
- Example style: `Fontname=Roboto,Fontsize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,MarginV=25`

### 🧪 Proof of Concept

**Implementation:**
```typescript
import { spawn } from 'child_process';

// Escape path for ffmpeg filter syntax
const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');

const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-ss', start.toString(),
    '-i', inputVideo,
    '-t', duration.toString(),
    // Apply subtitles filter and re-encode video
    '-vf', `subtitles=${escapedSrtPath}:force_style='Fontname=Arial,Fontsize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,MarginV=20'`,
    '-c:v', 'libx264',
    '-preset', 'fast', // Balance speed vs quality
    '-crf', '23',
    '-c:a', 'copy', // Don't re-encode audio
    outputPath
]);
```
*POC script tested in `research/pocs/subtitle-burn-poc.ts`.*

**Performance Impact:**
- **Before (Stream Copy):** ~1-3 seconds for a 60s clip.
- **After (Burn-in / Re-encode):** Processing time scales with video length and server CPU. Likely ~10-20 seconds for a 60s clip on standard hardware.

### 📈 Value Proposition

**Benefits:**
- ✅ **Massive Time Saver:** Eliminates external software from the creator's workflow.
- ✅ **Ready to Publish:** Outputs are immediately ready for social media.
- ✅ **Competitive Parity:** Brings the tool closer to dedicated AI clipping tools.

**User stories:**
- As a content creator, I can download a video with hardcoded subtitles so that I can upload it directly to TikTok without opening an editor.

### ⚖️ Trade-offs

**Pros:**
- ✅ High user value, solves a major pain point.
- ✅ Leverages existing infrastructure (FFmpeg microservice).

**Cons:**
- ❌ **Slower processing:** Re-encoding is significantly slower than stream copying.
- ❌ **Server cost:** Higher CPU utilization on the Railway service.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side WASM FFmpeg | Zero server cost | Extremely slow, mobile devices will crash | Not chosen. WASM video encoding is too heavy. |
| Native HTML5 Canvas Recording | Fast, real-time | Low quality, complex sync logic, drops frames | Not chosen. Unreliable for production exports. |

### 🛠️ Implementation Plan

**Phase 1: Backend Service** (estimated: 1 day)
- [ ] Add `/burn-subtitles` or modify `/cut-video` in `ffmpeg-service` to accept an SRT file upload alongside the video.
- [ ] Implement the FFmpeg command with the `subtitles` filter and appropriate styling.
- [ ] Handle temporary SRT file cleanup securely.

**Phase 2: Frontend Integration** (estimated: 1 day)
- [ ] Update `useFFmpeg` hook to support calling the new subtitle endpoint.
- [ ] Add an "Export with Subtitles" checkbox/button to the `HighlightCard` component.
- [ ] Ensure loading states handle the increased processing time gracefully.

**Total estimated effort:** 2 developer-days

**Dependencies:**
- Ensure the Railway FFmpeg environment has fonts installed (e.g., Arial/Roboto) and is compiled with `--enable-libass`.

**Risks:**
- ⚠️ **Server Timeout:** Long clips might exceed HTTP request timeouts. - Mitigation: Optimize encoding presets (`-preset veryfast`).
- ⚠️ **Missing Fonts:** FFmpeg might fallback to an ugly default font. - Mitigation: Ship a custom TTF file with the docker image.

### 📚 Resources

**Documentation:**
- FFmpeg Subtitles Filter: https://ffmpeg.org/ffmpeg-filters.html#subtitles-1

### 🎬 Next Steps

**If approved:**
1. Create a branch and implement the endpoint in `ffmpeg-service`.
2. Test the font rendering and tweak the `force_style` parameters for optimal social media viewing.
3. Integrate with the React frontend.

### 💬 Discussion Points
- Should we provide font customization options, or hardcode a good default?
- Should we automatically convert the video to 9:16 (vertical) for shorts/tiktok while burning subtitles?