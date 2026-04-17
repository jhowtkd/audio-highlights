## 🔬 Researcher: Vertical Video Conversion (9:16) Service

### 🎯 Executive Summary
Propose adding an automated vertical video conversion feature to `ffmpeg-service` and the client. This will allow users to instantly convert standard horizontal (16:9) highlights into mobile-ready vertical (9:16) formats optimized for TikTok, Instagram Reels, and YouTube Shorts.

### 💡 Problem Statement
**Current situation:**
- The application generates highlights from source media in their original aspect ratio (usually 16:9 for video podcasts).
- Users who want to post these highlights to modern short-form video platforms (TikTok, Reels, Shorts) must manually crop and edit the videos in external software to fit the required 9:16 vertical format.

**User impact:**
- Significant friction between generating a highlight and publishing it.
- Reduced perceived value, as the final output still requires manual editing work.
- Content may perform poorly if posted horizontally on vertical-first platforms.

**Example scenario:**
- A user generates an incredible 45-second highlight from a YouTube video.
- To post it on TikTok, they must download the horizontal video, import it into CapCut or Premiere Pro, crop it to 9:16 (hoping the speaker is in the center), and render it again.

### 🚀 Proposed Solution
**What:**
Implement two automated vertical conversion strategies via the `ffmpeg-service`:
1.  **Center Crop:** Crops the middle section of the video to 9:16. Best for single-speaker setups centered in the frame.
2.  **Blurred Background (Fit):** Scales the original video to fit the width of a 9:16 frame and fills the top and bottom with a blurred, scaled-up version of the same video. Best for multi-speaker or wide shots where cropping loses context.

**How it works:**
- Add a new endpoint `/convert-vertical` to `ffmpeg-service`.
- The endpoint takes a video file and a `mode` parameter (`crop` or `blur`).
- Uses FFmpeg complex filters (`-vf crop=ih*9/16:ih` for crop, and `[0:v]scale=-1:1280,crop=720:1280,boxblur=20:20[bg];[0:v]scale=720:-1[fg];[bg][fg]overlay=0:(H-h)/2` for blur) to re-render the video.
- On the frontend, add a "Vertical Video (9:16)" export option to `HighlightCard` and `ConfigPanel`.

**Why this approach:**
- **Zero Friction:** Users get platform-ready videos with zero manual editing.
- **Flexibility:** Providing both crop and blur options accommodates different framing styles (single vs. multiple speakers).
- **Centralized Processing:** Leverages our existing `ffmpeg-service` infrastructure.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg.
- **Filters:** `crop`, `scale`, `boxblur`, `overlay`.
- **Performance:** Re-encoding is required, so processing will take time proportional to the highlight duration (usually < 1 minute for short clips).
- **Compatibility:** Works seamlessly with the existing `ffmpeg-service` architecture.

**Competitive Analysis:**
- **OpusClip / Veed / Descript:** All offer auto-framing or vertical conversion as a core value proposition.
- **Our App:** Missing this crucial feature, making it a "step 1" tool rather than an end-to-end solution for social media creators.

### 🧪 Proof of Concept

**Implementation:**
A POC script `research/pocs/vertical-video-poc.js` was created to test the FFmpeg filters.

```javascript
// Center Crop
ffmpeg -i input.mp4 -vf 'crop=ih*9/16:ih' -c:a copy output_center.mp4

// Blurred Background
ffmpeg -i input.mp4 -filter_complex '[0:v]scale=-1:1280,crop=720:1280,boxblur=20:20[bg];[0:v]scale=720:-1[fg];[bg][fg]overlay=0:(H-h)/2' -c:a copy output_blur.mp4
```

**Demo:**
The POC successfully generated a synthetic 16:9 video and successfully converted it into two 9:16 vertical videos (one center-cropped, one with a blurred background) using the exact FFmpeg commands proposed.

**Performance:**
- Processing short clips (30-60s) takes seconds on a modern CPU.
- The audio stream is copied (`-c:a copy`), saving processing time.

### 📈 Value Proposition

**Benefits:**
- ✅ **End-to-End Workflow:** Users can go from long-form raw video directly to TikTok-ready clips without leaving the app.
- ✅ **Time Saving:** Eliminates the need for third-party editing tools.
- ✅ **Higher ROI for Users:** Vertical videos perform significantly better on social platforms.

**User stories:**
- As a **Content Creator**, I can **export my highlights directly to a 9:16 format with a blurred background** so that **I can immediately upload them to Instagram Reels without additional editing.**

### ⚖️ Trade-offs

**Pros:**
- ✅ Massive UX improvement for the primary use case (social media clips).
- ✅ relatively straightforward to implement using FFmpeg.

**Cons:**
- ❌ Re-encoding is computationally expensive and requires more server resources.
- ❌ "Dumb" center crop might cut off speakers who aren't perfectly centered (Active speaker tracking is a much harder problem requiring ML).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Active Speaker Tracking (ML) | Perfect framing | Extremely complex, requires heavy GPU ML models | Defer to future V2 |
| Client-side Canvas rendering | Saves server cost | Slow, memory intensive, buggy across browsers | Use server-side FFmpeg |

### 🛠️ Implementation Plan

**Phase 1: Service Update** (estimated: 1 day)
- [ ] Add `POST /convert-vertical` to `ffmpeg-service`.
- [ ] Implement `crop` and `blur` FFmpeg filter pipelines.

**Phase 2: Frontend Integration** (estimated: 2 days)
- [ ] Add "Format" selector (Original, Vertical Crop, Vertical Fit) to the Export/Download UI.
- [ ] Connect the UI to the new `ffmpeg-service` endpoint.

**Total estimated effort:** 3 developer-days

**Dependencies:**
- `ffmpeg` on the server

### 📚 Resources

**Documentation:**
- [FFmpeg Crop Filter](https://ffmpeg.org/ffmpeg-filters.html#crop)
- [FFmpeg Boxblur Filter](https://ffmpeg.org/ffmpeg-filters.html#boxblur)

### 🎬 Next Steps

**If approved:**
1.  Implement the `/convert-vertical` endpoint in `ffmpeg-service`.
2.  Update the UI to allow format selection during export.

### 💬 Discussion Points
- Should we provide an interactive cropping UI, or rely on automatic "smart" centering for V1?
- How much impact will vertical rendering have on our ffmpeg-service compute costs?
- Should the frontend preview the blurred background effect before exporting?

### ❓ Questions to resolve
- Do we want to support dynamic active-speaker tracking in the future, or is static crop enough?
- What max duration limits should we impose for vertical video exports to prevent server timeouts?
