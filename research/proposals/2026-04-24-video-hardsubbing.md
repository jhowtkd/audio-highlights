## 🔬 Researcher: Video Hardsubbing Support

### 🎯 Executive Summary
I propose adding a "Hardsubbing" feature to the application, leveraging the existing `ffmpeg-service`. This will allow users to generate videos (clips or mixes) with burned-in subtitles directly from the generated highlights, eliminating the need for external tools to add captions for social media platforms.

### 💡 Problem Statement
**Current situation:**
Currently, users can generate highlights and export them as video clips, or export subtitle files (SRT/VTT) separately. However, there is no way to automatically generate a video clip with the subtitles *burned in* (hardsubbed).

**User impact:**
Users who want to post clips to platforms that don't support separate subtitle files (or where hardsubs are preferred for styling/visibility) must use a third-party tool to combine the exported video and subtitle files. This disrupts the workflow and adds friction.

**Example scenario:**
A user generates a 30-second highlight meant for TikTok. They download the `.mp4` and the `.srt`, but then have to open Adobe Premiere or CapCut just to burn the subtitles onto the video before posting.

### 🚀 Proposed Solution
**What:**
Introduce a "Burn Subtitles" option when exporting or generating a video highlight. When enabled, the backend will use FFmpeg to re-encode the video with the subtitles permanently overlaid.

**How it works:**
1.  **Frontend/Backend Interaction:** The application already generates VTT/SRT data for highlights. When requesting a video generation, we pass a flag (and potentially subtitle styling parameters) to the `ffmpeg-service`.
2.  **FFmpeg Processing:**
    - The `ffmpeg-service` receives the media file and the VTT/ASS subtitle content.
    - It saves the subtitle content to a temporary file.
    - It uses the FFmpeg `subtitles` video filter (`-vf "subtitles=temp.vtt"`) to burn the text into the video stream.
    - Since applying video filters requires re-encoding, the video stream will be re-encoded (e.g., using `libx264`), while the audio stream can be copied (`-c:a copy`).

**Why this approach:**
-   **Native Integration:** Utilizes our existing FFmpeg microservice.
-   **Reliability:** The `subtitles` filter in FFmpeg is robust and widely used.
-   **Value Add:** Solves a major pain point for social media content creators directly within our app.

### 📊 Research Findings

**Technology Analysis:**
-   **Tool:** FFmpeg `subtitles` filter.
-   **Dependency:** Requires FFmpeg compiled with `--enable-libass` (which `ffmpeg-static` generally includes).
-   **Performance Impact:** Hardsubbing *requires* video re-encoding, meaning it will be significantly slower than the current "stream copy" mode used for fast cutting/concatenation.

**Competitive Analysis:**
-   **Descript / Riverside / Opus Clip:** All offer native, styled burned-in captions. It is a baseline expectation for AI clipping tools in 2024+.
-   **Our App:** Currently requires manual assembly outside the app.

### 🧪 Proof of Concept

**Implementation:**
A POC script (`research/pocs/hardsubbing_poc.js`) was created and successfully executed to verify the FFmpeg syntax using `ffmpeg-static`.

```javascript
// Simplified POC logic
const result = spawnSync(ffmpegPath, [
  '-y', '-i', 'test_video.mp4',
  '-vf', 'subtitles=subs.vtt',
  '-c:v', 'libx264', '-c:a', 'copy',
  'output_subbed.mp4'
]);
```
*Note: The POC successfully generated a video with the dummy VTT burned in.*

### 📈 Value Proposition

**Benefits:**
-   ✅ **Frictionless Workflow:** Creates ready-to-post social media assets in one click.
-   ✅ **Increased Engagement:** Hardsubs are proven to increase engagement and retention on muted auto-playing social feeds.
-   ✅ **Competitive Parity:** Brings the app up to speed with industry standards for clipping tools.

**User stories:**
-   As a **Social Media Manager**, I want to **export my highlight with burned-in captions** so that I can **immediately upload it to Instagram Reels without using another app**.

### ⚖️ Trade-offs

**Pros:**
-   ✅ High user value.
-   ✅ Utilizes existing FFmpeg infrastructure.

**Cons:**
-   ❌ **Processing Time:** Requires video re-encoding, which is CPU-intensive and slow compared to stream copying. This will increase server load and user wait times.
-   ❌ **Styling Limitations:** Basic VTT subtitles are hard to style heavily via FFmpeg alone (ASS format provides more control but is harder to generate). MVP should probably stick to basic VTT styling.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side rendering (Canvas/WebCodecs) | Offloads server cost | Highly complex, browser compatibility issues, slow | Not chosen |
| Export only SRT/VTT | Zero cost/time | Frustrating user experience | Current state (needs improvement) |

### 🛠️ Implementation Plan

**Phase 1: Backend (`ffmpeg-service`)** (Estimated: 2 days)
-   [ ] Update `/concat-segments` (or create a new endpoint, e.g., `/export-video`) to accept an optional `subtitles` string (VTT format).
-   [ ] Modify FFmpeg spawn arguments:
    -   If `subtitles` provided: Write to temp file, switch from `-c:v copy` to `-c:v libx264` and add `-vf subtitles=temp.vtt`.
    -   If not provided: Keep fast stream copy.

**Phase 2: Frontend Integration** (Estimated: 2 days)
-   [ ] Add a "Burn Subtitles" toggle in the export/generation UI.
-   [ ] When triggered, generate the VTT content using the existing `generateVTT` utility.
-   [ ] Pass the VTT content in the payload to the `ffmpeg-service`.

**Phase 3: Refinement (Future)**
-   Explore converting VTT to ASS format programmatically before passing to FFmpeg to enable advanced styling (fonts, colors, background boxes).

**Total estimated effort:** 4 developer-days

**Dependencies:**
-   Existing `ffmpeg-static` in `ffmpeg-service`.

### 📚 Resources

**Documentation:**
-   [FFmpeg Filters - subtitles](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

### 🎬 Next Steps

**If approved:**
1.  Begin Phase 1: Implement the hardsubbing logic in `ffmpeg-service`.
2.  Update the frontend to pass VTT data when the user requests a subbed export.
