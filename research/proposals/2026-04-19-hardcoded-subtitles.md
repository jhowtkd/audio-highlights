## 🔬 Researcher: Karaoke Mode (Hardcoded Subtitles)

### 🎯 Executive Summary
I propose adding a "Karaoke Mode" feature that allows users to export short viral clips (Highlights) with hardcoded subtitles directly burned into the video. This is a highly requested feature for social media content (TikTok, Reels, Shorts) where many users watch videos on mute.

### 💡 Problem Statement
**Current situation:**
Users can generate highlights and export them as standalone video files (`.mp4`) and subtitle files (`.srt`, `.vtt`). However, they must use an external tool (like Premiere Pro, CapCut, or Descript) to combine them into a final video with burned-in subtitles.

**User impact:**
Adds significant friction to the workflow. The goal of this tool is to be a one-stop-shop for generating viral clips. If users have to leave the app to add subtitles, the value proposition drops.

**Example scenario:**
A creator extracts a 30-second funny moment. They want to upload it to TikTok immediately. Without burned-in subtitles, the video will perform poorly because 70% of viewers watch without sound.

### 🚀 Proposed Solution
**What:**
Add a "Burn Subtitles" option to the Export dialogue for video highlights. When selected, the backend `ffmpeg-service` will use the `subtitles` video filter to permanently burn the SRT text onto the video stream.

**How it works:**
1. User clicks "Export Video (with Subtitles)".
2. Frontend sends the video file and the generated SRT content to a new `/burn-subtitles` endpoint on `ffmpeg-service`.
3. Backend saves the SRT to a temp file.
4. Backend runs `ffmpeg -i input.mp4 -vf "subtitles=temp.srt" -c:a copy output.mp4`.
5. Processed video is returned to the user.

**Why this approach:**
- Leverages existing `ffmpeg` infrastructure.
- `subtitles` filter is built into FFmpeg and handles complex text rendering natively using `libass`.
- Eliminates the need for complex client-side canvas rendering (which is slow and error-prone for video).

### 📊 Research Findings

**Technology Analysis:**
- **Tool:** FFmpeg `subtitles` filter.
- **Dependencies:** FFmpeg must be compiled with `--enable-libass` (which our `ffmpeg-static` or Docker image likely is).
- **Performance:** Re-encoding video is CPU intensive, but since we are only doing this for short Highlights (e.g., 30-60s), it is feasible.

**Competitive Analysis:**
- **Opus Clip, Veed.io, Descript:** All offer advanced, animated karaoke subtitles.
- **Our App:** Currently offers no subtitle burning.

### 🧪 Proof of Concept

**Implementation:**
A POC was created (`research/pocs/subtitle-burn-poc.js`) to verify that the `ffmpeg-static` binary bundled with the project supports the `subtitles` filter (requires `libass`).

```javascript
const ff = spawn(ffmpegPath, [
    '-i', testVideo,
    '-vf', `subtitles=${testSrt}`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-y', outVideo
]);
```

**Results:**
The POC ran successfully:
- Burned subtitles into a 3s test video in ~1.7s.
- Confirmed `libass` is available and functioning.

### 📈 Value Proposition

**Benefits:**
- ✅ **Complete Workflow:** Users don't need CapCut or Premiere to finish their social clips.
- ✅ **Higher Engagement:** Burned-in subtitles drastically increase retention on social platforms.

### ⚖️ Trade-offs

**Pros:**
- ✅ High user value.
- ✅ Uses existing backend infrastructure.

**Cons:**
- ❌ **Re-encoding required:** Burning subtitles means we cannot use `stream copy` (`-c copy`). The video stream *must* be re-encoded (`-c:v libx264`), which is slower and consumes more CPU on the backend.
- ❌ **Styling limitations:** The basic `subtitles` filter uses plain text styling. To get "fancy" TikTok-style animated word-by-word highlighting, we would need to generate complex `.ass` (Advanced SubStation Alpha) files instead of basic `.srt`.

### 🛠️ Implementation Plan

**Phase 1: Backend Integration** (2 days)
- [ ] Add `POST /burn-subtitles` endpoint to `ffmpeg-service`.
- [ ] Implement FFmpeg spawn logic with `-vf subtitles=X`.

**Phase 2: Frontend Integration** (1 day)
- [ ] Update Export modal to include a "Burn Subtitles" toggle (only for video highlights).
- [ ] Wire up API call to `ffmpeg-service`.

**Phase 3: Advanced Styling (Future)**
- [ ] Explore generating `.ass` files from Word Timestamps to highlight individual words as they are spoken.

**Total estimated effort:** 3 developer-days

### 📚 Resources

**Documentation:**
- [FFmpeg subtitles filter](https://ffmpeg.org/ffmpeg-filters.html#subtitles)

### 🎬 Next Steps

**If approved:**
1. Update `ffmpeg-service` to add the endpoint.
2. Design and implement the UI toggle in the export component.

### 💬 Discussion Points
- Should we provide options to upload custom fonts for subtitles?
