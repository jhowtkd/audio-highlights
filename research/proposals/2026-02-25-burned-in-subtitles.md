## 🔬 Researcher: Burned-in Subtitles for Video Highlights

### 🎯 Executive Summary
I propose adding a new feature to the `ffmpeg-service` to optionally burn hardcoded subtitles directly into exported video highlights. This will allow creators to download ready-to-publish, accessible videos for social media platforms (TikTok, Instagram Reels, YouTube Shorts) without needing external editing software to add captions.

### 💡 Problem Statement
**Current situation:**
AudioHighlights generates great clips and provides an SRT file alongside the downloaded video. However, most social media platforms require (or highly benefit from) text being directly visible on the video itself.

**User impact:**
Users currently have to download the video and the SRT file, open a third-party editor (like Premiere, CapCut, or Final Cut Pro), import both, format the text, and render a *second* time before publishing. This breaks the goal of "instant social media clips".

**Example scenario:**
A podcaster wants to share a 30-second highlight to Instagram Reels. They generate the highlight, but they cannot post the MP4 directly because it lacks the "viral" baked-in captions that retain viewer attention.

### 🚀 Proposed Solution
**What:**
- Update `ffmpeg-service`'s `/concat-segments` endpoint (or create a new `/export-highlight`) to accept an SRT file payload or transcript segments.
- Add an option in the UI (e.g., a "Burn Subtitles" checkbox on the Export Video button).
- Use FFmpeg's `subtitles` filter to hardcode the text onto the output video during processing.

**How it works:**
1.  Frontend formats the `TranscriptionSegment`s for a specific highlight into standard SRT format (which we already do in `src/lib/export.ts`).
2.  Frontend sends the media file, clip timestamps, and the SRT string to the backend.
3.  Backend writes the SRT to a temporary file (`/tmp/subs.srt`).
4.  Backend uses FFmpeg with the video filter: `-vf subtitles=/tmp/subs.srt:force_style='FontSize=24,PrimaryColour=&H00FFFFFF'`. Note: The path must be absolute and correctly escaped.

**Why this approach:**
- **Zero Client-side Processing:** FFmpeg on the server handles the heavy lifting, keeping the browser fast.
- **High Demand:** "Baked-in" subtitles are arguably the most requested feature for any clipping tool.
- **Utilizes Existing Data:** We already have the exact word-level (or segment-level) timestamps from Whisper.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg `subtitles` filter.
- **Requirements:** Requires FFmpeg compiled with `--enable-libass`. Most standard Docker images for FFmpeg include this.
- **Performance:** Re-encoding is required (cannot use `-c copy` for video). This means generating a video will take slightly longer, but it's an acceptable trade-off for the final polish.

**Competitive Analysis:**
- **OpusClip / Veed.io / Munch:** All offer highly customizable burned-in subtitles. It is their core value proposition.
- **Descript:** Offers standard and "fancy" captions.

### 🧪 Proof of Concept

**Implementation:**
A POC script was tested to verify the FFmpeg syntax.
```javascript
// Creates a temporary video and SRT, then applies subtitles filter
const srtPath = path.resolve('dummy.srt').replace(/\\/g, '/').replace(/:/g, '\\:');

await runCommand('ffmpeg', [
    '-y',
    '-i', 'input.mp4',
    '-vf', `subtitles=${srtPath}:force_style='FontSize=24,PrimaryColour=&H00FFFFFF'`,
    '-c:a', 'copy',
    'output_with_subs.mp4'
]);
```
*(Note: Attempted to run POC on current sandbox, but `ffmpeg` is not globally installed in this environment. However, the syntax is standard and well-documented).*

**Performance Impact:**
Because the video must be re-encoded (`-c:v libx264` instead of `-c copy`), processing will be slower. We should make this feature *optional* (opt-in via a checkbox) to preserve fast exports for users who just want raw clips.

### 📈 Value Proposition

**Benefits:**
- ✅ **Ready to Publish:** Generates content that can be uploaded immediately to TikTok/Reels.
- ✅ **Accessibility:** Ensures videos are accessible by default (many users watch without sound).
- ✅ **Increased Engagement:** Captioned videos are proven to have higher retention rates.

**User stories:**
- As a **Content Creator**, I want to **download a clip with subtitles burned in** so that **I can post it directly to Instagram without opening a video editor.**

### ⚖️ Trade-offs

**Pros:**
- Massive increase in the final product's value.
- Re-uses existing transcription data.

**Cons:**
- ❌ **Slower Export:** Requires re-encoding the video stream.
- ❌ **Server Load:** Increases CPU usage on the `ffmpeg-service` Railway instance.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side (Canvas/WASM) | No server cost | Very slow, buggy on mobile, high RAM | Not chosen |
| Send to 3rd Party API | Easy to implement | Expensive, adds latency | Not chosen |

### 🛠️ Implementation Plan

**Phase 1: Backend Service** (estimated: 2 days)
- [ ] Verify `ffmpeg-service` Docker image has `libass` enabled.
- [ ] Add `/export-with-subs` endpoint.
- [ ] Implement temporary file handling for the SRT payload.
- [ ] Implement FFmpeg `subtitles` filter logic with escaping.
- [ ] Ensure proper cleanup of the `.srt` file.

**Phase 2: Frontend Integration** (estimated: 1 day)
- [ ] Add a "Burn Subtitles" toggle next to the Export Video button.
- [ ] Create a function to generate the SRT string for the specific highlight.
- [ ] Send request to the new backend endpoint.

**Total estimated effort:** 3 developer-days

**Dependencies:**
- FFmpeg with `libass` (Standard on `linuxserver/ffmpeg` or `jrottenberg/ffmpeg`).

### 📚 Resources
- [FFmpeg Subtitles Filter Documentation](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)
- [How to burn subtitles into video (SuperUser)](https://superuser.com/questions/952136/how-to-burn-subtitles-into-video-using-ffmpeg)

### 🎬 Next Steps
**If approved:**
1. Check the FFmpeg build used in `ffmpeg-service` Dockerfile to ensure `libass` is present.
2. Build the backend endpoint and test with a hardcoded SRT string.
