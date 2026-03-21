## 🔬 Researcher: Server-Side Audiogram Generation

### 🎯 Executive Summary
I propose adding a new feature to generate audiograms (videos with audio waveforms and static backgrounds) on the server side using the existing `ffmpeg-service`. This will enable users to easily export their highlights as ready-to-share videos for social media platforms like TikTok, Instagram Reels, and YouTube Shorts.

### 💡 Problem Statement
**Current situation:**
Users can generate highlights and export them as audio, text, or subtitles. However, if they want to share an audio clip on video-centric social media platforms, they have to use external tools to combine the audio with an image and add a visualizer.

**User impact:**
Content creators experience friction. They have to leave the platform to finish their workflow.

**Example scenario:**
A podcaster uses AudioHighlights to find the best 30-second clip from a 2-hour interview. They want to post it on Instagram Reels. Currently, they download the `.mp3` and `.srt` files, open Premiere Pro or an online tool like Headliner, upload an image, add a waveform, and render the video.

### 🚀 Proposed Solution
**What:**
Implement an endpoint in the `ffmpeg-service` that accepts an audio file and a background image (or generates a solid color background) and returns an MP4 video with an animated waveform. Add a "Export as Video" option to the frontend highlight cards.

**How it works:**
- **Backend (`ffmpeg-service`):**
  Use FFmpeg's `showwaves` complex filter combined with the audio stream and a looped static image overlay.
  Example filter: `[1:a]showwaves=s=1080x400:mode=cline:colors=white[wave]; [0:v][wave]overlay=0:H-h-200:shortest=1`
- **Frontend:**
  Update the export dropdown in `HighlightCard` to include an "Audiogram (MP4)" option. When clicked, it calls the new `ffmpeg-service` endpoint.

**Why this approach:**
- **Memory guidelines state:** "For features requiring video rendering or generating audiograms (waveform videos), offload processing to the dedicated server-side `ffmpeg-service` microservice rather than using client-side alternatives (like Remotion or Canvas) to prevent browser OOM errors and improve stability."
- **Memory guidelines state:** "When using FFmpeg to generate audiograms, rely on the `showwaves` complex filter combined with an audio stream and a looped static image overlay... This approach is highly optimized and avoids reliance on specific FFmpeg input formats like `lavfi` which may not be present in all builds."

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg (via `ffmpeg-static` in `ffmpeg-service`)
- **Maturity:** Stable
- **Adoption:** Industry standard for media processing
- **Performance:** Rendering a 30-second audiogram with a static image and waveform is very fast (usually faster than real-time) on standard hardware.

**Competitive Analysis:**
- Descript: Offers built-in audiogram generation.
- Riverside.fm: Offers "Magic Clips" with video and text.
- Headliner: Dedicated tool for this, but adds an extra step.

### 🧪 Proof of Concept

**Implementation:**
```typescript
// POC code is available in research/pocs/audiogram/poc.ts
import { spawn } from 'child_process';
import path from 'path';

const runFfmpeg = (args: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        const ffmpegPath = path.resolve(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg');
        const childProc = spawn(ffmpegPath, args);
        childProc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`FFmpeg exited with code ${code}`));
        });
    });
};

// ... generated test audio and bg image ...
await runFfmpeg([
    '-y',
    '-loop', '1',
    '-i', bgImage,
    '-i', audioFile,
    '-filter_complex', '[1:a]showwaves=s=1080x400:mode=cline:colors=white[wave]; [0:v][wave]overlay=0:H-h-200:shortest=1',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-c:a', 'aac',
    '-shortest',
    outputFile
]);
```

**Demo:**
A working POC script was created and successfully generated an `audiogram.mp4` file with a blue background and a white waveform reacting to a test sine wave audio.

### 📈 Value Proposition

**Benefits:**
- ✅ **Increased User Retention:** Keeps creators in the app for their entire workflow.
- ✅ **Faster Time-to-Publish:** Eliminates the need for third-party video editors.
- ✅ **Higher Value:** Makes the tool significantly more attractive to social media managers and podcasters.

**User stories:**
- As a podcast creator, I can export a highlight directly as an MP4 audiogram so that I can immediately post it to Instagram Reels without using another tool.

### ⚖️ Trade-offs

**Pros:**
- ✅ Uses existing infrastructure (`ffmpeg-service`).
- ✅ Fast and reliable server-side processing.

**Cons:**
- ❌ Increases server load (CPU usage on `ffmpeg-service`).
- ❌ Requires handling background image uploads or generating them dynamically.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side (Remotion) | Offloads processing to client | High risk of browser OOM, complex setup | Not chosen because of memory guidelines |
| Client-side (Canvas + MediaRecorder) | No external dependencies | Tricky sync issues, poor performance on mobile | Not chosen because of memory guidelines |

### 🛠️ Implementation Plan

**Phase 1: Backend Endpoint** (estimated: 1 day)
- [ ] Add POST `/audiogram` endpoint to `ffmpeg-service`.
- [ ] Implement `multer` for receiving audio and background image files.
- [ ] Implement FFmpeg `showwaves` command execution.

**Phase 2: Frontend Integration** (estimated: 1 day)
- [ ] Update UI to allow selecting a background color or uploading an image.
- [ ] Add "Export Audiogram" button to highlight cards.
- [ ] Handle API request and file download.

**Total estimated effort:** 2 developer-days

### 🎬 Next Steps

**If approved:**
1. Implement the `/audiogram` endpoint in `ffmpeg-service`.
2. Add frontend UI for triggering the export.

**Questions to resolve:**
- [ ] What will the default background template look like?
- [ ] How will we handle potentially large generated video files (streaming vs. download link)?

### 📚 Resources

**Documentation:**
- [FFmpeg showwaves filter docs](https://ffmpeg.org/ffmpeg-filters.html#showwaves)
- [FFmpeg overlay filter docs](https://ffmpeg.org/ffmpeg-filters.html#overlay-1)

**Examples:**
- [Headliner App (Competitor)](https://www.headliner.app/)

**Community:**
- [Stack Overflow discussions on FFmpeg audiograms](https://stackoverflow.com/questions/tagged/ffmpeg+audiogram)

### 💬 Discussion Points
- Should we allow users to upload custom background images, or only provide a set of pre-defined colors/templates initially?
- Should the `ffmpeg-service` upload the resulting MP4 to a cloud storage (like S3) and return a URL, or stream the file directly back to the client?
