## 🔬 Researcher: Server-Side Burned-In Subtitles

### 🎯 Executive Summary
I propose adding a new feature to the `ffmpeg-service` microservice that generates videos with hardcoded (burned-in) subtitles directly from the transcription data. This allows users to export ready-to-publish, accessible video clips for social media without needing external editing software.

### 💡 Problem Statement
**Current situation:**
Currently, users can only export the audio/video highlight and a separate `.srt` or `.vtt` file. To create a social media ready video (e.g., for TikTok, Instagram Reels, or LinkedIn), they must import both the video and the subtitle file into a third-party editor (like Premiere, CapCut, or Descript) to burn the subtitles into the video.

**User impact:**
Content creators experience a fragmented workflow. They lose time exporting, importing, and rendering in other tools just to add basic subtitles, which are essential for social media engagement.

**Example scenario:**
A podcaster generates a great 60-second highlight clip using our tool. To share it on Instagram, they need subtitles. They download the `.mp4` and `.srt` files, open CapCut, import both, style the text, and render a new video. This adds 10-15 minutes of work per clip.

### 🚀 Proposed Solution
**What:**
1.  **Backend (`ffmpeg-service`)**: Add a new endpoint (e.g., `/burn-subtitles`) that accepts a video file and an `.srt` file, and uses the `subtitles` FFmpeg filter to burn the text onto the video track.
2.  **Frontend**: Add a "Burn Subtitles & Export" button in the Highlight Card UI that sends the highlight segment and its generated `.srt` to the new endpoint.

**How it works:**
-   **FFmpeg Filter**: The core technology is the FFmpeg `subtitles` filter (which relies on `libass`).
-   **Command**: `ffmpeg -i input.mp4 -vf "subtitles=subs.srt:force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1,Shadow=0'" -c:a copy output.mp4`
-   **Re-encoding**: Unlike the current stream-copy (`-c copy`) used for fast cutting, burning subtitles *requires* video re-encoding (`-c:v libx264`). The audio stream can still be copied (`-c:a copy`).

**Why this approach:**
-   **Server-Side Reliability**: Client-side FFmpeg WebAssembly builds often lack `libass` support required for the `subtitles` filter. Doing this server-side in our existing Dockerized Node service guarantees the filter is available and offloads the heavy re-encoding process from the user's browser.
-   **Seamless UX**: Keeps the user within the application for the entire workflow.

### 📊 Research Findings

**Technology Analysis:**
-   **Library/Framework**: FFmpeg (via `fluent-ffmpeg` / `ffmpeg-static`) within a Node.js Express service.
-   **Maturity**: The `subtitles` filter is a mature, standard feature of FFmpeg.
-   **Performance Impact**: High. Video re-encoding is CPU intensive and slow. A 60-second 1080p clip might take 10-30 seconds to process depending on server resources, compared to <1 second for a stream copy.

**Competitive Analysis:**
-   **Descript**: Offers highly customizable burned-in captions (core feature).
-   **Opus Clip**: Automatically burns animated, styled captions (core feature).
-   **Our App**: Lacks this capability entirely.

**Best Practices:**
-   **Styling**: Use simple, high-contrast default styles (e.g., white text, black outline) to ensure readability across different video backgrounds.
-   **Asynchronous Processing**: Due to the re-encoding time, this endpoint might need to be asynchronous (polling or webhooks) if clips are long, though for short highlights (under 2 minutes), a synchronous request might still be acceptable with a good loading UI.

### 🧪 Proof of Concept

**Implementation:**
A POC script (`research/pocs/burn_subtitles_poc.mjs`) was created and successfully executed in the repository root to verify the `subtitles` filter works with the installed `ffmpeg-static` binary.

```javascript
// Simplified POC logic
import ffmpegPath from 'ffmpeg-static';
import { execFileSync } from 'child_process';
import fs from 'fs';

// 1. Create a dummy .srt file
fs.writeFileSync('test.srt', `1\n00:00:00,000 --> 00:00:02,000\nHello World!`);

// 2. Create a dummy video
execFileSync(ffmpegPath, ['-f', 'lavfi', '-i', 'color=c=blue:s=1280x720:d=5', '-c:v', 'libx264', '-y', 'dummy.mp4']);

// 3. Burn subtitles
execFileSync(ffmpegPath, [
  '-i', 'dummy.mp4',
  '-vf', 'subtitles=test.srt',
  '-c:v', 'libx264',
  '-y', 'output_with_subs.mp4'
]);
```

**Results:**
The POC successfully generated a video (`output_with_subs.mp4`) with the text "Hello World!" burned into the frames, confirming that `libass` is correctly linked in our `ffmpeg-static` distribution.

### 📈 Value Proposition

**Benefits:**
-   ✅ **Workflow Consolidation**: Eliminates the need for third-party editors.
-   ✅ **Increased Value**: Makes the exported assets immediately usable for social media.
-   ✅ **Accessibility**: Promotes the creation of accessible content by default.

**User stories:**
-   As a social media manager, I want to export a video highlight with burned-in subtitles so I can directly upload it to Instagram Reels without further editing.

### ⚖️ Trade-offs

**Pros:**
-   ✅ High user demand feature for this type of application.
-   ✅ Reuses existing backend infrastructure (`ffmpeg-service`).

**Cons:**
-   ❌ **Processing Cost**: Requires CPU-intensive video re-encoding, which will increase server load and hosting costs.
-   ❌ **Latency**: Exporting will take significantly longer than the current instant stream-copy method.
-   ❌ **Customization Constraints**: While basic styling is possible via FFmpeg arguments, offering complex text animations (like Opus Clip's word-by-word highlighting) is extremely difficult with plain FFmpeg and `.srt` files.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side FFmpeg WebAssembly | Zero server cost, privacy. | Often lacks `libass` support. Very slow re-encoding in the browser. | Not chosen due to technical limitations and poor UX. |
| Cloud Encoding APIs (e.g., Mux, AWS Elemental) | Scalable, fast. | External dependency, usage-based costs. | Not chosen for V1; start with our own service. |

### 🛠️ Implementation Plan

**Phase 1: Backend Endpoint** (estimated: 2 days)
-   [ ] Add `POST /burn-subtitles` endpoint to `ffmpeg-service`.
-   [ ] Implement logic to receive video file, `.srt` content, and apply the `subtitles` filter using `fluent-ffmpeg`.
-   [ ] Define and apply default styling parameters (font size, colors, outline).

**Phase 2: Frontend Integration** (estimated: 1.5 days)
-   [ ] Update `HighlightCard` component to include a "Burn Subtitles & Export Video" action.
-   [ ] Implement API call to the new endpoint, sending the video Blob and generating the `.srt` string dynamically.
-   [ ] Add a progress indicator (spinner or progress bar) as this action will take time.

**Phase 3: Polish & Error Handling** (estimated: 1 day)
-   [ ] Handle timeouts or errors gracefully if re-encoding fails or takes too long.
-   [ ] Clean up temporary files on the server post-processing.

**Total estimated effort:** 4.5 developer-days

**Dependencies:**
-   No new external libraries needed; leverages existing `ffmpeg-static` and `fluent-ffmpeg`.

### 📚 Resources

**Documentation:**
-   [FFmpeg Filters Documentation: subtitles](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)
-   [FFmpeg ASS Styling Guide](https://ffmpeg.org/ffmpeg-filters.html#ass)

### 🎬 Next Steps

**If approved:**
1.  Implement the `/burn-subtitles` endpoint in `ffmpeg-service`.
2.  Update the frontend UI to expose this new export option.
**Questions to resolve:**
- [ ] What should the default font styling and color be?
- [ ] Do we need to make the re-encoding an asynchronous process with webhooks for longer highlights?

### 💬 Discussion Points
- Should we consider allowing users to customize font size and color in a future iteration, or keep it strictly default for V1?
