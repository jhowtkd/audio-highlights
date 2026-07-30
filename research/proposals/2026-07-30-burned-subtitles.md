## 🔬 Researcher: Burned Subtitles (Hardsubs)

### 🎯 Executive Summary
I propose adding a "Burn Subtitles" feature to our video export workflow. This feature will use FFmpeg's `subtitles` filter to hardcode SRT captions directly into the video frames, making the exported videos instantly ready for social media platforms without requiring users to manually upload separate caption files.

### 💡 Problem Statement
**Current situation:**
Currently, users can generate highlights and export them as MP4 videos, and they can download SRT files separately.

**User impact:**
For social media (Instagram, TikTok, YouTube Shorts), captions are essential because many users watch with the sound off. Requiring users to take our exported video and SRT file into a third-party editor (like Premiere or CapCut) just to burn the subtitles adds significant friction to their workflow.

**Example scenario:**
A user generates a viral 30-second highlight. They want to post it to Instagram Reels immediately. Instead of just hitting "Post", they have to download the MP4, download the SRT, open a video editor, align the SRT, re-render the video, and then post it.

### 🚀 Proposed Solution
**What:**
1.  **Backend (`ffmpeg-service`)**: Add a new endpoint (e.g., `/burn-subtitles`) or extend existing cut/concat endpoints to accept an SRT file (or string) and apply the `-vf subtitles=file.srt` FFmpeg filter.
2.  **Frontend**:
    - Add an "Include Subtitles" toggle in the export modal/settings.
    - Generate the SRT content on the client (we already have `generateFullTranscriptSRT`).
    - Send both the video and the SRT content to the new backend endpoint.

**How it works:**
- The frontend sends the video file and the SRT string to the backend.
- The backend writes the SRT string to a temporary `.srt` file.
- `ffmpeg` is executed with `-vf subtitles=temp.srt`. Note that this *requires* re-encoding the video stream (`-c:v libx264`), which will be slower than our current stream-copy (`-c copy`) approach.

**Why this approach:**
-   **Native to our stack:** FFmpeg has built-in, robust subtitle rendering.
-   **High Value:** Directly addresses a massive pain point for social media creators.

### 📊 Research Findings

**Technology Analysis:**
-   **Tool:** FFmpeg (`ffmpeg-static`)
-   **Filter:** `subtitles` (requires FFmpeg to be compiled with `libass`, which standard binaries usually are).
-   **Performance:** Re-encoding is required. Processing a 60-second clip will take longer than a simple cut (e.g., 5-10 seconds depending on the server's CPU).

**Competitive Analysis:**
-   **Opus Clip / Munch / Veed:** Burning stylized subtitles is their core value proposition.
-   **Our App:** Currently lacks this completely.

**Best Practices:**
- Use a readable font with strong contrasting outline (e.g. Arial with black outline) to ensure readability on mobile screens.

### 🧪 Proof of Concept

**Implementation:**
A POC script was tested to verify FFmpeg's subtitle capabilities in our environment.

```javascript
// Simplified POC logic
const srtPath = path.join(__dirname, 'temp.srt');
fs.writeFileSync(srtPath, srtContent);
const filter = `subtitles=${srtPath}`;

const ffmpeg = spawn(ffmpegPath, [
    '-i', videoPath,
    '-vf', filter,
    '-c:a', 'copy', // Audio can still be copied
    outputPath
]);
```
**Results:** The standard `ffmpeg-static` binary includes the necessary libraries (`libass`) to render subtitles.

**Demo:**
N/A (Backend POC output confirmed via logs and manual video inspection)

**Performance:**
- Before: Stream-copy is nearly instantaneous (e.g. < 1 second for a short clip)
- After: Re-encoding takes around 5-10 seconds for a 60-second clip, depending on CPU.
- Impact: Noticeable increase in export time, but saves the user minutes of manual work.

### 📈 Value Proposition

**Benefits:**
-   ✅ **Ready to Publish:** Videos can go straight from our app to social media.
-   ✅ **Increased Retention:** Users don't need to leave our app to finish their workflow.

**User stories:**
-   As a social media manager, I want my exported clips to have hardcoded subtitles so I don't have to use Premiere Pro.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Massive workflow improvement for users.
-   ✅ Relies on battle-tested FFmpeg filters.

**Cons:**
-   ❌ **Slower Export:** Requires re-encoding the video stream, which is significantly slower than our current `-c copy` method.
-   ❌ **Server Load:** Re-encoding is CPU-intensive. We may need to monitor `ffmpeg-service` resource usage.
-   ❌ **Styling Limitations:** Standard SRT subtitles are basic (white text, black outline). We don't get the "bouncing word" karaoke style easily without complex ASS (Advanced SubStation Alpha) subtitle generation.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side WASM | Offloads CPU from server | Very slow, may crash browser | Not chosen because of performance limitations |
| Cloud service (e.g. AWS MediaConvert) | Scalable, high quality | Adds complexity, recurring cost | Not chosen because we already have an FFmpeg microservice |

### 🛠️ Implementation Plan

**Phase 1: Backend Integration** (estimated: 2 days)
-   [ ] Update `ffmpeg-service` to accept an optional SRT file/string on the cut/concat endpoints, or create a dedicated `/burn-subtitles` endpoint.
-   [ ] Implement logic to write the temp SRT file, apply the `-vf subtitles` filter, and manage re-encoding parameters.
-   [ ] Ensure proper cleanup of temp SRT files, especially on failure.

**Phase 2: Frontend Integration** (estimated: 1 day)
-   [ ] Add a UI toggle for "Burn Subtitles" in the export dialog.
-   [ ] Modify the export API call to include the generated SRT data if the toggle is checked.

**Total estimated effort:** 3 developer-days

**Dependencies:**
-   None (uses existing `ffmpeg-static`)

**Risks:**
- ⚠️ Server overload from CPU-intensive re-encoding - Mitigation: Implement queueing/limits on `ffmpeg-service` if needed.
- ⚠️ Subtitle font missing in Docker container - Mitigation: Add a standard TTF font (e.g. Arial or DejaVu Sans) to the Docker image and configure FFmpeg to use it.

### 📚 Resources

**Documentation:**
-   [FFmpeg Filters Documentation: subtitles](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

**Examples:**
- N/A

**Community:**
- N/A

### 🎬 Next Steps

**If approved:**
1.  Begin Phase 1 by implementing the backend FFmpeg logic for rendering SRT files.
2.  Update frontend export dialog to include the new option.
3.  Deploy and monitor `ffmpeg-service` performance.

**Questions to resolve:**
- [ ] Do we want to support basic font styling (color, size) from the UI?
- [ ] Should this feature be limited to premium/authenticated users to save server costs?

### 💬 Discussion Points
- Would it be better to implement a queue system for the FFmpeg microservice *before* rolling this out, given the increased CPU load?
- Should we investigate generating ASS subtitles instead of SRT for better styling (e.g. custom backgrounds for readability)?
