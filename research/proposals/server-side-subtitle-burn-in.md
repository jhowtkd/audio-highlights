## 🔬 Researcher: Server-Side Subtitle Burn-In

### 🎯 Executive Summary
Implement server-side subtitle burn-in (hardcoding) within the `ffmpeg-service` microservice. This allows users to download final video clips with baked-in subtitles, improving shareability on social media platforms that don't support external closed captions natively.

### 💡 Problem Statement
**Current situation:**
The application generates text highlights and allows downloading SRT files. However, users sharing clips on social media (Instagram, TikTok) often need the subtitles burned directly into the video file, as those platforms typically don't accept SRT attachments.

**User impact:**
Users have to use a third-party tool (like Premiere Pro or CapCut) to merge the downloaded video clip and SRT file before posting to social media, adding friction to their workflow.

**Example scenario:**
A user generates a great 60-second highlight of a podcast. They want to post it to Instagram Reels immediately. Currently, they have to download the video, download the SRT, open a video editor, import both, render, and then upload to Instagram.

### 🚀 Proposed Solution
**What:**
Add a new endpoint `/burn-subtitles` to the existing `ffmpeg-service` microservice that takes a video file and an SRT file (or subtitle text) and returns a video with burned-in subtitles.

**How it works:**
- The frontend will send the generated video segment and its corresponding SRT content to the `ffmpeg-service`.
- The service will write the SRT to a temporary file.
- Using FFmpeg's `subtitles` filter, the service will re-encode the video with the subtitles burned into the frames.
- The path to the SRT file will be safely escaped (`path.replace(/\\/g, '/').replace(/:/g, '\\:')`) to avoid FFmpeg parsing errors.
- The resulting video is streamed back to the client.

**Why this approach:**
- **Consistency:** Server-side rendering guarantees the subtitles look the same regardless of the user's device or browser.
- **Performance:** Offloading the encoding to the Railway microservice prevents blocking the main thread or causing out-of-memory errors on mobile devices.
- **Leverage Existing Infra:** We already have a Dockerized FFmpeg service, making this a natural extension.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg (`subtitles` filter)
- **Maturity:** Highly stable and industry standard.
- **Performance:** Re-encoding is required for burn-in (cannot use stream copy), which takes more CPU and time. However, since highlights are short (e.g., 30-60s), processing time is acceptable.

**Competitive Analysis:**
- Descript, Opus Clip, and Munch all provide burned-in subtitles by default as it's a critical feature for short-form content.

**Best Practices:**
- Subtitles should use high-contrast styling (e.g., white text with a black outline or shadow) to remain readable over any video background.
- Use `force_style` in the FFmpeg filter to control font size, color, and alignment.

### 🧪 Proof of Concept

**Implementation:**
A POC was created at `research/pocs/server-side-subtitles-poc.js`.
It successfully generates a dummy video, creates an SRT file, and uses FFmpeg to burn the subtitles into a new output video.

**Demo:**
The POC ran successfully and produced an `output.mp4` with baked-in subtitles. (See POC script for details).

**Performance:**
- Re-encoding a short clip is relatively fast on modern server CPUs, but it is an O(N) operation based on video length and resolution.

### 📈 Value Proposition

**Benefits:**
- ✅ Provides a complete, end-to-end "ready to post" video asset for social media.
- ✅ Removes the need for users to use third-party editing software.
- ✅ Increases the perceived value and utility of the application.

**User stories:**
- As a content creator, I can download a video with hardcoded subtitles so that I can immediately upload it to TikTok without further editing.

### ⚖️ Trade-offs

**Pros:**
- ✅ Excellent user experience (frictionless sharing).
- ✅ Consistent output quality.

**Cons:**
- ❌ **Server Cost:** Requires re-encoding, which uses significantly more CPU resources on the Railway server compared to the current `stream copy` approach.
- ❌ **Processing Time:** Users will have to wait longer for the download to generate compared to a simple cut.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side FFmpeg (WASM) | Zero server cost | High memory usage, slow on mobile, large bundle size | Not chosen because mobile users would struggle with performance. |
| HTML Canvas Recording | Reuses existing DOM | Janky frame rates, out-of-sync audio, brittle | Not chosen because it's unreliable for high-quality export. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 day)
- [ ] Add `/burn-subtitles` endpoint to `ffmpeg-service/src/index.ts`.
- [ ] Implement robust error handling and temporary file cleanup for the SRT and video files.

**Phase 2: Core Feature** (estimated: 1.5 days)
- [ ] Add an "Export with Subtitles" button to the frontend `HighlightCard` component.
- [ ] Create a utility function to call the new microservice endpoint and handle the downloaded blob.

**Phase 3: Polish & Testing** (estimated: 0.5 days)
- [ ] Add customizable font styles (size, color) as optional parameters.
- [ ] Verify A/V sync and styling.

**Total estimated effort:** 3 developer-days

**Dependencies:**
- Existing FFmpeg installation in the microservice Docker image.

**Risks:**
- ⚠️ **Server Overload:** High CPU usage during concurrent requests. - Mitigation: Implement request queuing or rate limiting in the microservice.
- ⚠️ **Font Availability:** FFmpeg requires fonts to be installed on the system. - Mitigation: Ensure a standard font (like Arial or Roboto) is included in the Dockerfile.

### 📚 Resources

**Documentation:**
- [FFmpeg Subtitles Filter](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

**Community:**
- [Stack Overflow: Burning subtitles with FFmpeg](https://stackoverflow.com/questions/8672809/use-ffmpeg-to-add-text-subtitles)

### 🎬 Next Steps

**If approved:**
1. Update `ffmpeg-service/Dockerfile` to include necessary fonts (e.g., `ttf-freefont`).
2. Implement the endpoint in `ffmpeg-service`.
3. Add the UI integration in the frontend.
