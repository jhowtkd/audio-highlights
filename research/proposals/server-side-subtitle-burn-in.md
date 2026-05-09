## 🔬 Researcher: Server-Side Video Subtitle Burn-In (Hardsubs)

### 🎯 Executive Summary
I propose adding a server-side subtitle burn-in feature to the `ffmpeg-service`. This will allow users to generate video highlights with embedded subtitles ("hardsubs") directly from the application, eliminating the need to use external software to combine the exported video and SRT files. This significantly improves the end-to-end user experience for content creators.

### 💡 Problem Statement
**Current situation:**
The application currently exports video clips and a separate SRT subtitle file. Users who want subtitles visually embedded in the video (for platforms like Instagram Reels, TikTok, or YouTube Shorts) must use a third-party video editor (like Premiere, CapCut, or Final Cut) to import the video and SRT file and render a final output.

**User impact:**
Content creators experience a fragmented workflow. The extra step of rendering the video again in another tool is time-consuming and introduces friction.

**Example scenario:**
A creator generates a great 30-second highlight of a podcast. To post it to TikTok, they have to download the MP4, download the SRT, open CapCut, import both, align them (if needed), and wait for CapCut to export the video before finally uploading it.

### 🚀 Proposed Solution
**What:**
Implement an endpoint in the `ffmpeg-service` that accepts a video file and an SRT file (or generates the SRT from transcription segments) and uses FFmpeg's `subtitles` filter to burn the text directly into the video frames.

**How it works:**
1.  **Frontend:** The user selects "Export with burned-in subtitles". The frontend sends the final video highlight request and the corresponding transcription segments (or SRT string) to the backend.
2.  **Backend (ffmpeg-service):**
    *   Creates a temporary SRT file.
    *   Uses FFmpeg with the `subtitles` filter: `ffmpeg -i input.mp4 -vf "subtitles=temp.srt" -c:v libx264 -c:a copy output.mp4`.
    *   The backend must carefully escape the absolute path to the SRT file (`escaped_path = path.replace(/\\/g, '\\\\').replace(/:/g, '\\:')`).
3.  **Result:** The service returns a new MP4 file with the text permanently drawn onto the video.

**Why this approach:**
-   **Native Integration:** FFmpeg already supports a robust `subtitles` filter (via libass).
-   **Value:** It solves a major user pain point and makes the tool a true "one-stop-shop" for clip generation.

### 📊 Research Findings

**Technology Analysis:**
-   **Library/Framework:** FFmpeg (specifically `ffmpeg-static` in our current stack, though ensuring it's compiled with `libass` is crucial for the `subtitles` filter).
-   **Maturity:** Highly mature and stable. The `subtitles` filter is the industry standard for this task.
-   **Adoption:** Used universally in video processing pipelines.

**Competitive Analysis:**
-   Descript: Offers comprehensive built-in subtitling and customization.
-   OpusClip / Munch: Automatically burn in styled subtitles for vertical video.
-   Our App: Currently requires external tools for this step.

**Best Practices:**
-   Since burning subtitles modifies the visual frames, it **strictly requires video re-encoding** (`-c:v libx264`). We cannot use stream copy (`-c copy`) for the video stream as we do in the `concat` endpoint.
-   The audio stream can still be copied (`-c:a copy`) to save time.

### 🧪 Proof of Concept

**Implementation:**
A POC script was created to verify the `subtitles` filter functionality within a Node environment using `child_process.execSync` and `ffmpeg-static`.

```javascript
const { execSync } = require('child_process');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

// Setup dummy input.mp4 and dummy.srt...

const videoPath = path.resolve('dummy.mp4');
const srtPath = path.resolve('dummy.srt');
const outputPath = path.resolve('output_with_subs.mp4');

// Escape backslashes and colons for the FFmpeg filter syntax
const escapedSrtPath = srtPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');

console.time('Burn-in Duration');
try {
  // Burning in subtitles requires full video re-encoding (-c:v libx264)
  execSync(`"${ffmpegStatic}" -y -i "${videoPath}" -vf "subtitles=${escapedSrtPath}" -c:v libx264 -c:a copy "${outputPath}"`, { stdio: 'inherit' });
  console.log('Success! Subtitles burned into video.');
} catch (error) {
  console.error('Error burning subtitles:', error.message);
}
console.timeEnd('Burn-in Duration');
```

**Performance:**
-   **POC Duration:** Re-encoding a 3-second 720p video took ~1.9 seconds on the test container.
-   **Impact:** Re-encoding is computationally expensive. Generating a 60-second clip will likely take 30-60 seconds on standard hardware, whereas stream copying without subtitles is near-instant.

### 📈 Value Proposition

**Benefits:**
-   ✅ **Frictionless Workflow:** Creators can publish directly from our app to social media without intermediary software.
-   ✅ **Increased Stickiness:** Users are more likely to rely entirely on AudioHighlights.

**User stories:**
-   As a content creator, I can download a highlight video that already has subtitles on it, so that I can immediately upload it to TikTok.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Enormous UX improvement for the final step of the user journey.
-   ✅ Leverages our existing `ffmpeg-service` infrastructure.

**Cons:**
-   ❌ **Performance Hit:** Requires full video re-encoding, significantly increasing processing time and server CPU load.
-   ❌ **Cost:** If hosted on a cloud provider charging by compute time, this will increase infrastructure costs.

**Alternatives considered:**

| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side Canvas rendering (RecordRTC) | Offloads compute to user | Highly unreliable, low quality, complex sync issues | Not chosen because of quality and reliability concerns. |
| WebCodecs API | Modern, client-side, fast | Complex implementation, spotty browser support for encoding | Not chosen because it's too complex for current scope. |

### 🛠️ Implementation Plan

**Phase 1: Foundation (ffmpeg-service)** (estimated: 2 days)
-   [ ] Verify the production Docker image for `ffmpeg-service` includes FFmpeg compiled with `--enable-libass`.
-   [ ] Create a new endpoint `POST /burn-subtitles` accepting a video file and SRT data.
-   [ ] Implement the execution logic using the escaped path and `-c:v libx264`.

**Phase 2: Core Feature (Frontend)** (estimated: 2 days)
-   [ ] Update the export UI to include an "Export Video with Subtitles" option.
-   [ ] Implement logic to bundle the video blob and the generated SRT text to send to the new endpoint.
-   [ ] Add appropriate loading states, as this operation will be noticeably slower than a standard export.

**Phase 3: Polish & Testing** (estimated: 1 day)
-   [ ] Test with various video formats and aspect ratios.
-   [ ] Ensure subtitle styling (if any) is respected or legible defaults are set.

**Total estimated effort:** 5 developer-days

**Dependencies:**
-   `ffmpeg-static` (already present, verify libass support).

**Risks:**
-   ⚠️ **Server Load:** Concurrent burn-in requests could overwhelm the `ffmpeg-service`. - Mitigation: Implement a queuing system (like BullMQ) or strict rate limiting for this specific endpoint.

### 📚 Resources

**Documentation:**
-   [FFmpeg subtitles filter](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)
-   [FFmpeg documentation on escaping](https://ffmpeg.org/ffmpeg-utils.html#Quoting-and-escaping)

### 🎬 Next Steps

**If approved:**
1.  Test the `ffmpeg` installation in the `ffmpeg-service` Docker container to ensure `libass` is enabled (`ffmpeg -filters | grep subtitles`).
2.  Design the API contract for the `/burn-subtitles` endpoint.

### 💬 Discussion Points
-   Given the heavy CPU requirements, should we restrict this feature to premium/logged-in users only, or implement a hard limit on video duration for free users?
