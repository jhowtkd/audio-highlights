## 🔬 Researcher: Server-Side Audiogram Generation

### 🎯 Executive Summary
I propose adding a **Server-Side Audiogram Generator** to the `ffmpeg-service` microservice. This feature will allow users to generate highly engaging, shareable video clips (audiograms) from their audio highlights, complete with a static background image and a dynamic waveform visualization. This directly addresses the need for podcasters to easily create promotional content for social media platforms like Instagram Reels, TikTok, and YouTube Shorts.

### 💡 Problem Statement
**Current situation:**
Users can upload audio, transcribe it, and use GPT-5 to generate intelligent highlights. However, if the source material is audio-only, the output is simply a shorter audio clip or text transcript.

**User impact:**
Audio-only content performs poorly on visual-first social media platforms (Instagram, TikTok). Users currently have to download the audio clip and use a third-party tool (like Headliner or Canva) to create a video with a waveform before they can share it effectively.

**Example scenario:**
A podcaster identifies a viral 30-second quote using our "Highlights" feature. To share it on TikTok, they must download the `.mp3`, open a separate video editor, upload a background image, add a waveform effect, sync it, render it, and finally upload it to TikTok. This multi-step process creates significant friction.

### 🚀 Proposed Solution
**What:**
A new endpoint in the `ffmpeg-service` (e.g., `/generate-audiogram`) that accepts an audio clip and a background image, and returns an MP4 video featuring the audio synced to a dynamic, animated waveform overlay.

**How it works:**
The service will utilize native `child_process.spawn` invoking `ffmpeg-static`. It will use the `showwaves` complex filter to generate the visual waveform directly from the audio stream and overlay it onto the looped static image.
-   **Input:** Audio file (`.mp3` or `.wav`), Background Image (`.jpg` or `.png`).
-   **Processing:** FFmpeg reads the image (looped) and the audio, applies `showwaves`, overlays it, and encodes to H.264 MP4.
-   **Output:** A ready-to-share `.mp4` video file.

**Why this approach:**
-   **Server-Side Reliability:** Generating audiograms on the client side (e.g., using Canvas and `MediaRecorder` or heavy libraries like Remotion) is prone to Out of Memory (OOM) crashes, especially on mobile devices or with longer clips. Offloading this to the existing `ffmpeg-service` ensures stability and consistent performance.
-   **Native FFmpeg:** Using `child_process.spawn` with `ffmpeg-static` is highly optimized and avoids dependency issues associated with older wrapper libraries like `fluent-ffmpeg` or relying on specific, potentially missing FFmpeg input formats (like `lavfi`). The `showwaves` filter is standard and robust.

### 📊 Research Findings

**Technology Analysis:**
-   **Tool:** FFmpeg (`ffmpeg-static` binary).
-   **Filter:** `showwaves` (complex filter).
-   **Maturity:** Extremely stable; FFmpeg is the industry standard for A/V processing.
-   **Performance:** Generating a 30-second 1080p audiogram takes roughly 5-10 seconds on a standard server, depending on encoding parameters.

**Competitive Analysis:**
-   **Headliner / Veed.io:** Dedicated platforms for this exact feature. High friction (requires account, separate workflow).
-   **Descript:** Includes audiogram generation built-in (highly valued feature).
-   **Our App:** Currently requires users to leave the platform to create visual assets from audio highlights.

**Best Practices:**
-   Offload heavy video encoding to dedicated microservices (already established via `ffmpeg-service`).
-   Use standard codecs (H.264/AAC) for maximum compatibility across social platforms.

### 🧪 Proof of Concept

**Implementation:**
A Proof of Concept script has been created at `research/pocs/audiogram-poc.ts`.

```typescript
// Core FFmpeg logic from POC:
const args = [
    '-loop', '1', '-i', imagePath,
    '-i', audioPath,
    '-filter_complex', '[1:a]showwaves=s=1080x480:colors=white:mode=cline[wave];[0:v][wave]overlay=0:H-h-200:shortest=1[outv]',
    '-map', '[outv]', '-map', '1:a',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest',
    outputPath
];
```

**Demo / Performance:**
-   Tested locally with standard MP3 and PNG inputs.
-   Successfully generates a 1080x1920 (vertical) video suitable for TikTok/Reels.
-   Memory usage remains flat during generation compared to client-side Canvas rendering.

### 📈 Value Proposition

**Benefits:**
-   ✅ **Complete Workflow:** Users can go from raw audio upload -> highlight generation -> shareable video asset without leaving the application.
-   ✅ **Increased Shareability:** Visual videos drastically increase engagement on social media compared to static text or audio links.
-   ✅ **High Perceived Value:** This is a "premium" feature that saves users significant time and software costs.

**User stories:**
-   As a podcaster, I want to convert my 45-second audio highlight into a vertical video with a waveform so I can immediately post it to Instagram Reels.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Leverages existing infrastructure (`ffmpeg-service` is already deployed and handles video).
-   ✅ High-quality output with precise A/V sync.
-   ✅ Solves a major user pain point for audio-first creators.

**Cons:**
-   ❌ **Server Load:** Video encoding (H.264) is CPU-intensive. Generating many audiograms concurrently could stress the `ffmpeg-service` container, potentially requiring scaling or queueing.
-   ❌ **Storage:** Temporary video files require more disk space than audio clips during processing.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-Side Canvas + MediaRecorder | Zero server cost, immediate visual feedback. | High risk of browser OOM crashes, inconsistent encoding support across browsers, sync issues. | Not chosen because reliability is paramount for long files. |
| Remotion (React Video) | Familiar React paradigm for building visuals. | Heavy client bundle, complex rendering pipeline, overkill for a simple waveform overlay. | Not chosen because FFmpeg `showwaves` is simpler and more direct. |

### 🛠️ Implementation Plan

**Phase 1: Backend Implementation (`ffmpeg-service`)** (estimated: 1.5 days)
- [ ] Add `POST /generate-audiogram` endpoint to `ffmpeg-service/src/index.ts`.
- [ ] Implement file upload handling for audio and background image (multipart/form-data).
- [ ] Integrate the FFmpeg `spawn` logic from the POC.
- [ ] Implement cleanup logic for temporary files.

**Phase 2: Frontend Integration** (estimated: 2 days)
- [ ] Add a "Generate Audiogram" button/modal to the `HighlightCard` component (when source is audio-only).
- [ ] Create a simple UI to allow users to upload a background image (or select a default) and choose dimensions (e.g., 9:16 vertical, 1:1 square).
- [ ] Implement API call to `ffmpeg-service` and handle the resulting video stream/download.

**Total estimated effort:** 3.5 developer-days

**Dependencies:**
- `ffmpeg-static` (Already present in `ffmpeg-service`).
- `multer` (Already present in `ffmpeg-service` for file uploads).

**Risks:**
- ⚠️ **CPU Bottleneck:** - Mitigation: Monitor Railway CPU usage and implement a simple processing queue or concurrent request limit if necessary.

### 📚 Resources

**Documentation:**
- [FFmpeg Filters Documentation: showwaves](https://ffmpeg.org/ffmpeg-filters.html#showwaves)

### 🎬 Next Steps

**If approved:**
1.  Implement the `/generate-audiogram` endpoint in the `ffmpeg-service`.
2.  Design the frontend modal for background image upload and audiogram generation.

### 💬 Discussion Points
-   Should we provide a set of default, pre-designed background templates, or require users to upload their own image every time?
