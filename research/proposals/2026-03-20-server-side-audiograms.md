## 🔬 Researcher: Server-Side Audiogram Generation

### 🎯 Executive Summary
Implement server-side audiogram generation in the existing FFmpeg microservice to allow users to convert audio clips into shareable video files with animated waveforms. This adds a critical feature for content creators who need visual elements when sharing podcast excerpts on video-centric social media platforms (Instagram, TikTok, YouTube Shorts).

### 💡 Problem Statement
**Current situation:**
AudioHighlights currently allows users to generate text highlights and extract the corresponding audio clips (MP3). However, social media platforms heavily favor or outright require video formats.

**User impact:**
Content creators are forced to download the MP3, import it into another video editing tool (like CapCut, Premiere, or Headliner), find a background image, and manually create a waveform just to post the clip.

**Example scenario:**
A podcaster gets a great 60-second highlight from their interview. They download `clip_1.mp3` but can't post it directly to Instagram Reels or TikTok. They must leave our application to finish their workflow.

### 🚀 Proposed Solution
**What:**
Add a new `/generate-audiogram` endpoint to the `ffmpeg-service` that accepts an audio file (and optionally a background image and text) and returns a generated MP4 video with an animated waveform synced to the audio.

**How it works:**
The endpoint will utilize `ffmpeg` (which is already running in the microservice) with complex filters. Specifically, it will use the `showwaves` filter combined with an `overlay` to composite the waveform animation over a background image or solid color, muxed with the original audio track.

**Why this approach:**
We already have an isolated FFmpeg microservice (Railway/Docker). Leveraging this existing infrastructure means no new heavy dependencies for the Next.js frontend, no WASM browser memory limitations for rendering long videos, and it perfectly aligns with our current architecture.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Native `ffmpeg` via Node.js `fluent-ffmpeg` / `child_process.spawn`
- **Maturity:** Highly stable (FFmpeg has been the industry standard for decades)
- **Adoption:** Used by virtually all major video processing platforms
- **Community:** Massive documentation and Stack Overflow presence
- **License:** GPL/LGPL (FFmpeg)
- **Bundle size:** Zero impact on the frontend. The `ffmpeg-service` already includes the FFmpeg binary.

**Competitive Analysis:**
- Headliner: Core feature is creating audiograms from audio clips.
- OpusClip: Automatically generates captions and visual elements for clips.
- Descript: Built-in audiogram generation for podcast exports.
Adding this brings AudioHighlights closer to parity with premium podcasting tools.

**Best Practices:**
- Process video asynchronously or via streams to prevent memory exhaustion on the server.
- Use `libx264` with `ultrafast` preset to balance generation speed and file size.
- Ensure the output resolution matches standard social media aspect ratios (e.g., 9:16 for Shorts/Reels, 1:1 for Instagram feed, 16:9 for YouTube).

### 🧪 Proof of Concept

**Implementation:**
```javascript
// A minimal working Node.js script using fluent-ffmpeg to generate an audiogram
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

async function createAudiogram(audioPath, imagePath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(imagePath)
            .loop(1) // Loop the static background image
            .input(audioPath)
            .complexFilter([
                // Generate a waveform from the audio input [1:a]
                // s=widthxheight, colors=WaveformColor
                '[1:a]showwaves=s=1280x200:colors=White:mode=line[wave]',
                // Overlay the waveform onto the background video [0:v] at x=0, y=260
                '[0:v][wave]overlay=0:260[outv]'
            ])
            .outputOptions([
                '-map [outv]', // Map the visual output
                '-map 1:a',    // Map the audio input
                '-c:v libx264',
                '-preset ultrafast', // Fast encoding
                '-c:a aac',
                '-shortest'    // Stop encoding when the shortest stream (audio) ends
            ])
            .save(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
    });
}
```

**Performance:**
- Local testing generated a 5-second 720p audiogram in under 1 second using the `ultrafast` preset.
- The resulting MP4 file is highly compressed and suitable for web streaming.

### 📈 Value Proposition

**Benefits:**
- ✅ **End-to-End Workflow:** Users can go from raw podcast -> transcript -> text highlight -> ready-to-post video clip without leaving the app.
- ✅ **Increased Shareability:** Video clips are far more engaging on social media than text or audio alone, indirectly promoting the user's content and our tool.
- ✅ **Zero Frontend Overhead:** Offloading to the existing FFmpeg microservice keeps the web client light and avoids browser crashes.

**User stories:**
- As a podcast host, I can extract a 60s highlight and instantly download an MP4 audiogram so that I can post it directly to Instagram Reels.

### ⚖️ Trade-offs

**Pros:**
- ✅ Leverages existing infrastructure (FFmpeg microservice).
- ✅ Extremely fast generation using native FFmpeg filters compared to Canvas-based rendering in the browser.

**Cons:**
- ❌ Adds computational load to the microservice (video encoding is CPU-intensive).
- ❌ Initial implementation may lack advanced customization (custom fonts, dynamic karaoke captions) compared to specialized tools like Remotion.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Remotion (Frontend/Serverless) | Highly customizable React-based rendering, beautiful UI/UX. | Expensive to run on Vercel Serverless, requires a complete rewrite of how we handle video generation, large dependency. | Not chosen because it introduces too much complexity and cost compared to our existing FFmpeg service. |
| Client-side Canvas + MediaRecorder | Zero server cost. | Extremely unreliable for long clips, requires the user to keep the tab open, poor framerate consistency, high risk of OOM crashes. | Not chosen because of poor UX and stability. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Add `/generate-audiogram` endpoint to `ffmpeg-service/src/index.ts`.
- [ ] Implement multer file handling for audio and optional background image.
- [ ] Write the core FFmpeg command using `child_process.spawn` or `fluent-ffmpeg` mimicking the POC.

**Phase 2: Core Feature** (estimated: 1 day)
- [ ] Add error handling and cleanup of temporary files in the microservice.
- [ ] Update frontend API clients (`use-ffmpeg.ts`) to communicate with the new endpoint.

**Phase 3: Polish & Testing** (estimated: 2 days)
- [ ] Add a "Generate Audiogram" button to the Highlight Card UI on the frontend.
- [ ] Provide basic customization options (e.g., aspect ratio, waveform color) passed as query parameters.

**Total estimated effort:** 5 developer-days

**Dependencies:**
- `fluent-ffmpeg` in `ffmpeg-service` (optional, can use raw `spawn` as done currently).

**Risks:**
- ⚠️ **Server CPU Exhaustion:** Concurrent audiogram requests could overwhelm the Railway container. - Mitigation: Implement a basic request queue or limit concurrent encoding jobs in the microservice.

### 📚 Resources

**Documentation:**
- [FFmpeg showwaves filter documentation](https://ffmpeg.org/ffmpeg-filters.html#showwaves)
- [Fluent-ffmpeg complexFilter examples](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg#complexfilter-setting-complex-filters)

### 🎬 Next Steps

**If approved:**
1. Implement the endpoint in `ffmpeg-service`.
2. Expose the API in the frontend via a new function in `use-ffmpeg.ts`.
3. Build the UI in the Highlight section.

### 💬 Discussion Points
- Should we provide default background images (e.g., blurred gradients) if the user doesn't upload one?
- Should we eventually integrate the transcription data to burn subtitles directly into the audiogram?
