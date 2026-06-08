## 🔬 Researcher: Vertical Video Export (9:16) with Burned-in Subtitles

### 🎯 Executive Summary
Propose adding a feature to export highlights as vertical video (9:16 aspect ratio) with burned-in subtitles. This makes the generated clips immediately ready for platforms like TikTok, Instagram Reels, and YouTube Shorts without requiring external editing software.

### 💡 Problem Statement
**Current situation:**
- The app can extract video segments based on highlights, but the output maintains the original aspect ratio (typically 16:9).
- Subtitles are exported as separate SRT/VTT files.
- Users want to post these clips to TikTok/Reels, which require vertical formats and burned-in subtitles for best engagement.

**User impact:**
- Content creators must take the extracted clip and SRT file into an external editor (CapCut, Premiere) to crop and burn subtitles before posting.

**Example scenario:**
- A podcaster generates a 45-second highlight from their interview.
- They download the `.mp4` and `.srt`.
- They must open CapCut, create a 9:16 project, import the video, auto-frame or manually center it, import the subtitles, style them, and re-export.

### 🚀 Proposed Solution
**What:**
Add a new server-side endpoint in `ffmpeg-service` (e.g., `POST /export-vertical`) that takes a video file and an SRT file (or raw subtitle data) and returns a 9:16 video with burned-in subtitles.

**How it works:**
- It uses FFmpeg on the backend (since client-side WASM FFmpeg lacks the `libass` library needed for the `subtitles` filter).
- The FFmpeg command uses a complex filtergraph:
  - `crop=ih*(9/16):ih` to crop the center of the video to 9:16.
  - `subtitles=subs.srt:force_style='FontSize=24,Alignment=2,...'` to burn the subtitles.
- The UI will add a "Export for TikTok/Reels" button alongside the standard download options.

**Why this approach:**
- **Server-side:** Client-side FFmpeg WASM cannot burn subtitles reliably due to missing `libass`. Relying on the `ffmpeg-service` ensures it works.
- **Center Crop:** The simplest and most effective approach for typical podcast setups where the speaker is centered.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg (`crop` and `subtitles` filters).
- **Maturity:** Highly mature.
- **Dependency:** Requires the `ffmpeg-service` environment to have FFmpeg compiled with `--enable-libass` (which standard package managers usually include, and `ffmpeg-static` supports).

**Competitive Analysis:**
- **OpusClip, Munch, Descript:** All offer auto-cropping and dynamic subtitles. This is a core feature for this type of application.

### 🧪 Proof of Concept

**Implementation:**
A POC script (`vertical_video_poc.mjs`) was created to test generating a test video, an SRT file, and then using `ffmpeg-static` to crop and burn subtitles.

```javascript
// Example FFmpeg command used in POC
const ffmpeg = spawn(ffmpegPath, [
    '-y',
    '-i', 'test_input.mp4',
    '-vf', "crop=ih*(9/16):ih,subtitles=test_subs.srt:force_style='FontSize=24,PrimaryColour=&H00FFFF,Alignment=2'",
    '-c:a', 'copy',
    'test_output_vertical.mp4'
]);
```

**Demo:**
The POC successfully created a 9:16 video (`test_output_vertical.mp4`) with bright cyan subtitles burned into the bottom center of the frame.

**Performance:**
- Re-encoding is required, so it will be slower than the fast `stream copy` used for standard cuts. However, since highlights are typically short (< 60s), processing time will be reasonable (seconds to a minute).

### 📈 Value Proposition

**Benefits:**
- ✅ **Frictionless workflow:** Users get ready-to-publish content directly from the app.
- ✅ **Higher value:** Increases the perceived value of the tool from a "cutter" to a "content generator".

**User stories:**
- As a **Content Creator**, I can **export my highlights as vertical videos with subtitles** so that **I can immediately post them to TikTok without using another app.**

### ⚖️ Trade-offs

**Pros:**
- ✅ Massively improves UX for the primary use case (social media clips).
- ✅ Centralized processing ensures consistent quality.

**Cons:**
- ❌ Requires server-side processing and re-encoding, increasing CPU load on the backend.
- ❌ Simple center crop might cut off subjects if they aren't centered (future improvement: face tracking).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side rendering (Canvas/WebCodecs) | No server cost | Extremely complex to build, buggy across browsers | Not chosen |
| FFmpeg WASM | Client-side | Standard builds lack `libass` (no `subtitles` filter) | Not chosen |

### 🛠️ Implementation Plan

**Phase 1: Backend Service** (estimated: 2 days)
- [ ] Add `POST /export-vertical` endpoint to `ffmpeg-service`.
- [ ] Implement logic to accept video, start/end times, and subtitle data.
- [ ] Generate temporary SRT file and run FFmpeg with `crop` and `subtitles` filters.

**Phase 2: Frontend Integration** (estimated: 2 days)
- [ ] Add "Export Vertical (TikTok/Reels)" button to highlight cards.
- [ ] Implement API call to the new service endpoint, passing the necessary segment info and generating the SRT content on the fly.
- [ ] Handle loading state while re-encoding happens.

**Total estimated effort:** 4 developer-days

**Risks:**
- ⚠️ **Server Load:** Re-encoding video is CPU intensive.
  - *Mitigation:* Implement rate limiting and perhaps queueing if usage scales.

### 📚 Resources

**Documentation:**
- [FFmpeg Crop Filter](https://ffmpeg.org/ffmpeg-filters.html#crop)
- [FFmpeg Subtitles Filter](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

### 🎬 Next Steps

**If approved:**
1.  Verify `ffmpeg-service` Docker image has `libass` support enabled in its FFmpeg installation.
2.  Implement the backend endpoint.
