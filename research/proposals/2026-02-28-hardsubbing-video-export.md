## 🔬 Researcher: Subtitle Burn-in (Hardsubbing) for Video Export

### 🎯 Executive Summary
I propose adding a **Subtitle Burn-in (Hardsubbing)** feature to the `ffmpeg-service` microservice, enabling users to export generated video highlights with the subtitles directly embedded into the video frames. This feature is crucial for social media platforms (TikTok, Instagram Reels, YouTube Shorts) where the majority of videos are watched on mute.

### 💡 Problem Statement
**Current situation:**
Users can currently generate video clips (via FFmpeg stream copy) and export the corresponding transcription to SRT/VTT. However, they cannot automatically combine them. To get subtitled videos, users must download the video and the subtitle file separately, open a third-party editor (like Premiere Pro or CapCut), import both, sync them, and re-render the video.

**User impact:**
- **High Friction:** Exporting a finished clip takes multiple steps and external software.
- **Low Retention:** Users expecting a complete "all-in-one" solution for social media clips will churn if they have to finish the job elsewhere.

**Example scenario:**
A creator generates a 60-second highlight perfect for TikTok. To post it, they need the captions burnt in. Currently, they download `.mp4` and `.srt`, open CapCut, add both, and export again. With hardsubbing, they simply click "Export Video with Subtitles" and get a ready-to-post file.

### 🚀 Proposed Solution
**What:**
Add an option to the video export flow to burn subtitles directly into the video using FFmpeg's `subtitles` filter.

**How it works:**
1.  **Frontend:** When the user clicks "Export Video", provide an option to include subtitles.
2.  **Preparation:** Generate the `.vtt` or `.srt` file for the specific highlight.
3.  **Backend (`ffmpeg-service`):** Add a `/burn-subtitles` endpoint (or extend the existing cut endpoint).
4.  **Processing:** Use the FFmpeg command `ffmpeg -i input.mp4 -vf subtitles=captions.vtt -c:a copy output.mp4`.
    *   *Note: Using video filters requires re-encoding the video track (`-c:v libx264`), so we cannot use fast stream copy (`-c copy`) for the video portion.*

**Why this approach:**
-   **Native Integration:** FFmpeg's `subtitles` filter (powered by `libass`) is robust and handles VTT/SRT natively.
-   **Zero External Dependencies:** We already use `ffmpeg-static`, which is compiled with `--enable-libass`.

### 📊 Research Findings

**Technology Analysis:**
-   **Tool:** FFmpeg `subtitles` filter.
-   **Requirement:** FFmpeg must be compiled with `libass` (which `ffmpeg-static` is).
-   **Performance:** Re-encoding video is CPU-intensive and slower than stream copying. A 60-second clip might take 10-30 seconds to process depending on the server CPU.

**Competitive Analysis:**
-   **Descript, OpusClip, Munch:** All provide hardsubbed videos by default, often with dynamic "karaoke" highlighting.
-   **Our App:** Currently only outputs raw video and separate subtitle files.

**Best Practices:**
-   Ensure subtitle files use absolute paths and are properly escaped for the FFmpeg filter syntax (especially on Windows).
-   Keep audio untouched (`-c:a copy`) to save processing time.

### 🧪 Proof of Concept

I created a POC script (`research/pocs/subtitle-burnin-poc.ts`) that generates a test video, creates a VTT file, and successfully burns the subtitles into a new video using the `subtitles` filter.

**Implementation:**
```typescript
// Construct absolute path and escape for FFmpeg filter syntax
const subPath = path.resolve(TEST_SUB).replace(/\\/g, '/').replace(/:/g, '\\:');

ffmpeg(TEST_VIDEO)
  .videoFilters(`subtitles='${subPath}'`)
  .outputOptions(['-c:a copy']) // Keep audio as is
  // Video will be re-encoded automatically to apply the filter
  .output(OUTPUT_VIDEO)
```

**Results:**
-   The POC successfully rendered a video with the text permanently embedded.
-   Confirmed that `ffmpeg-static` supports the `subtitles` filter.

### 📈 Value Proposition

**Benefits:**
-   ✅ **All-in-one Solution:** Completes the workflow for social media creators.
-   ✅ **Viral Readiness:** Hardsubbed videos perform significantly better on social platforms.
-   ✅ **Competitive Parity:** Matches basic expectations set by tools like OpusClip.

**User stories:**
-   As a **Content Creator**, I want to export my highlight with subtitles already on it so I can post it directly to TikTok from my phone.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Massive UX improvement for the primary target audience.
-   ✅ Standard FFmpeg capability.

**Cons:**
-   ❌ **Server Load:** Re-encoding video requires significantly more CPU and memory than our current `concat` (stream copy) operations.
-   ❌ **Processing Time:** Exports will take longer (seconds to minutes instead of instant).

### 🛠️ Implementation Plan

**Phase 1: Backend Implementation** (estimated: 1 day)
-   [ ] Add `/export-hardsub` endpoint to `ffmpeg-service` (or extend existing video generation logic).
-   [ ] Endpoint should accept media file and subtitle content (or generate it internally from transcript segments).
-   [ ] Write subtitle content to a temporary file.
-   [ ] Run FFmpeg with `-vf subtitles=temp.vtt` and re-encode video.

**Phase 2: Frontend Integration** (estimated: 1 day)
-   [ ] Update the Video Export UI to include a "Burn Subtitles" toggle.
-   [ ] Update the API calls to use the new hardsubbing capability when selected.
-   [ ] Add a loading state indicating that rendering will take longer than a raw cut.

**Total estimated effort:** 2 developer-days

**Dependencies:**
-   Existing `ffmpeg-static` and `fluent-ffmpeg`.

### 📚 Resources

**Documentation:**
-   [FFmpeg Filters: subtitles](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

### 🎬 Next Steps

**If approved:**
1.  Add the hardsubbing capability to the `ffmpeg-service`.
2.  Update the frontend export UI.
