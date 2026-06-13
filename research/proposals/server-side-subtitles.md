## 🔬 Researcher: Server-Side Subtitle Burn-In for Video Highlights

### 🎯 Executive Summary
Enable users to burn subtitles directly into their exported video highlights by leveraging the existing server-side `ffmpeg-service`. This feature significantly increases the "shareability" of clips on platforms like Instagram Reels and TikTok, where the majority of users watch videos on mute.

### 💡 Problem Statement
**Current situation:**
Currently, users can download the video clip and a separate `.srt` or `.vtt` file. They then have to use a third-party tool (like CapCut or Premiere Pro) to burn the subtitles into the video before posting it to social media.

**User impact:**
Content creators (our primary users) experience friction in their workflow. The extra step of merging video and subtitles in another application adds time and complexity, reducing the overall value of AudioHighlights as a one-stop tool for creating viral clips.

**Example scenario:**
A user generates a great 45-second highlight from a podcast. They want to post it immediately to TikTok, but realize they need to download the MP4 and SRT separately, open CapCut on their phone, import both, adjust styling, and export again before they can post.

### 🚀 Proposed Solution
**What:**
Add an option to "Export with Subtitles (Burned-in)" directly from the Highlight Card UI. This will trigger a backend process that generates the subtitle file and overlays it onto the video segment before returning the final MP4.

**How it works:**
1.  **Frontend:** We add a "Download Video with Subtitles" button next to the existing export options. When clicked, it sends a request to the `ffmpeg-service` containing the video file (or referencing it), the start/end times, and the generated subtitle text.
2.  **Backend (`ffmpeg-service`):**
    *   Create an API endpoint (e.g., `/burn-subtitles`).
    *   Write the subtitle text to a temporary `.srt` file.
    *   Use the `fluent-ffmpeg` wrapper with `ffmpeg-static` to apply the `subtitles` filter: `-vf subtitles=temp.srt`.
    *   Return the processed video stream to the client.
3.  **WASM Limitation:** We *cannot* do this client-side using `@ffmpeg/ffmpeg` because standard WASM builds of FFmpeg lack the `libass` library, which is required for the `subtitles` filter. Our research confirms that the backend `ffmpeg-static` package *does* include `libass`.

**Why this approach:**
It utilizes our existing microservice architecture, avoiding the limitations of client-side WASM while delivering a highly requested feature that directly impacts the core value proposition (creating viral clips).

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `ffmpeg-static` (already in use backend), `fluent-ffmpeg`
- **Maturity:** Highly stable (FFmpeg is the industry standard)
- **Adoption:** Universal in media processing
- **Community:** Massive (FFmpeg community)
- **License:** GPL (compatible with our usage as an external process)
- **Bundle size:** N/A (runs on the server-side microservice)

**Competitive Analysis:**
- OpusClip: Provides highly stylized, burned-in subtitles automatically.
- Veed.io: Core feature is automatic, burned-in subtitling with styling options.
- *Our App:* Currently requires external tools for burn-in.

**Best Practices:**
- Use the `.srt` format for simple styling and broad compatibility with FFmpeg's `subtitles` filter.
- Re-encoding the video is mandatory when burning subtitles, so we should optimize the `-preset` and `-crf` flags in FFmpeg to balance speed and quality for social media (e.g., `-preset veryfast -crf 23`).

### 🧪 Proof of Concept

**Implementation:**
A standalone Node.js script was created and run in the backend environment using `ffmpeg-static` to verify that the `subtitles` filter works correctly:

```javascript
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import { execSync } from 'child_process';

ffmpeg.setFfmpegPath(ffmpegStatic);

// Generate dummy video
execSync(`${ffmpegStatic} -f lavfi -i color=c=blue:s=320x240:d=2 -y dummy.mp4`);

// Create dummy SRT
fs.writeFileSync('dummy.srt', `1\n00:00:00,000 --> 00:00:01,000\nHello World\n\n2\n00:00:01,000 --> 00:00:02,000\nTesting Subtitles\n`);

// Apply subtitles
ffmpeg('dummy.mp4')
  .videoFilters(`subtitles=dummy.srt`)
  .save('output_subbed.mp4');
```
*Result: The script successfully produced an MP4 with burned-in subtitles, confirming `libass` is present in our backend `ffmpeg-static`.*

### 📈 Value Proposition

**Benefits:**
- ✅ **Reduces Friction:** Eliminates the need for third-party editing apps.
- ✅ **Increases Engagement:** Videos with subtitles perform significantly better on social media.
- ✅ **Higher Retention:** Users are more likely to use AudioHighlights as their end-to-end tool.

**User stories:**
- As a content creator, I want to download a video clip with subtitles already burned in so that I can immediately post it to Instagram Reels without using another app.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massive UX improvement for the primary use case.
- ✅ Leverages existing backend infrastructure (`ffmpeg-service`).

**Cons:**
- ❌ **Server Load:** Re-encoding video with subtitles is computationally expensive compared to simple stream copying (`-c copy`). This will increase load on the Railway service.
- ❌ **Processing Time:** It will take longer for the user to download the subtitled video than a raw cut.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side FFmpeg WASM | Zero server cost, works offline | Fails due to missing `libass` in standard builds. Building custom WASM is complex and bloated. | Not chosen because of technical limitations. |
| Client-side HTML5 Canvas Overlay + RecordRTC | Fast, no server cost | Poor quality, sync issues, complex to implement reliably across browsers. | Not chosen because of quality concerns. |

### 🛠️ Implementation Plan

**Phase 1: Backend Service (`ffmpeg-service`)** (estimated: 2 days)
- [ ] Add `fluent-ffmpeg` to `ffmpeg-service` dependencies if not already present.
- [ ] Create a new POST endpoint `/burn-subtitles`.
- [ ] Implement logic to receive video, receive/generate SRT, apply `subtitles` filter, and stream response.
- [ ] Implement error handling and temporary file cleanup.

**Phase 2: Frontend Integration** (estimated: 2 days)
- [ ] Update `use-ffmpeg` hook to call the new backend endpoint.
- [ ] Add UI button "Download with Subtitles" in `HighlightCard`.
- [ ] Handle loading states and error messages gracefully during the longer processing time.
- [ ] Pass the highlight's transcript segments to generate the SRT on the fly for the request.

**Phase 3: Polish & Testing** (estimated: 1 day)
- [ ] Test with various video formats and aspect ratios.
- [ ] Optimize FFmpeg encoding parameters for speed vs quality.
- [ ] Ensure rate limiting in `ffmpeg-service` handles the heavier requests appropriately.

**Total estimated effort:** 5 developer-days

**Dependencies:**
- `fluent-ffmpeg` in `ffmpeg-service`

**Risks:**
- ⚠️ **Server Exhaustion:** The Railway microservice might run out of memory or CPU under concurrent burn-in requests. - Mitigation: Implement strict rate limiting and potentially queue requests if scaling becomes necessary. Use `-preset ultrafast` or `veryfast` to minimize CPU time.

### 📚 Resources

**Documentation:**
- [FFmpeg Subtitles Filter Docs](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)
- [Fluent-FFmpeg GitHub](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)

**Examples:**
- [Burning Subtitles with FFmpeg](https://trac.ffmpeg.org/wiki/HowToBurnSubtitlesIntoVideo)

### 🎬 Next Steps

**If approved:**
1. Create a PR to add the `/burn-subtitles` endpoint to `ffmpeg-service`.
2. Deploy the updated `ffmpeg-service` to a staging environment.
3. Develop the frontend integration and test against the staging service.

### 💬 Discussion Points
- Should we offer basic styling options (font size, color) for the burned-in subtitles, or stick to a default, highly readable style for the V1?
- How do we want to handle the UI during the longer wait time? Should we implement a progress bar based on FFmpeg output, or just a generic spinner?
