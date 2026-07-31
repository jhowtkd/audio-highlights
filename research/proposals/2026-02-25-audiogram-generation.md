## 🔬 Researcher: Server-Side Audiogram Generation

### 🎯 Executive Summary
Implement server-side audiogram (waveform video) generation using FFmpeg for audio-only highlights. This allows users to easily share podcast audio clips on visual platforms like Instagram, TikTok, and YouTube Shorts.

### 💡 Problem Statement
**Current situation:**
Currently, when users upload an audio file (e.g., MP3) and generate highlights, the output is just an audio clip. Audio clips are difficult to share on modern social media platforms, which prioritize or strictly require video formats (MP4/MOV).

**User impact:**
Users want to share their podcast clips directly to Instagram Reels or TikTok, but they can't without using a third-party tool to convert the MP3 into a video. This adds friction and reduces the value of the platform.

**Example scenario:**
A user generates a great 60-second highlight from their audio podcast. They download the MP3, but to post it to Instagram Reels, they have to use CapCut or another app to add a background and waveform, costing them extra time.

### 🚀 Proposed Solution
**What:**
Add a feature to the `ffmpeg-service` to generate an "audiogram" (a video with a dynamic waveform visualization) for audio-only highlights.

**How it works:**
1.  **Frontend:** Detects if the source is audio-only. If so, offers a "Download Audiogram" option.
2.  **Backend (`ffmpeg-service`):** A new endpoint `/generate-audiogram` accepts an audio clip.
3.  **Processing:** Uses FFmpeg's `showwaves` or `showfreqs` filter to generate a visual waveform video from the audio track and combines it with a basic background color (or image).
4.  **Delivery:** Streams the resulting MP4 video back to the client.

**Why this approach:**
-   **No new major dependencies:** We already use `ffmpeg-static` and `fluent-ffmpeg` in the backend service, which fully support complex filters like `showwaves`.
-   **Server-Side:** Video rendering is resource-intensive. Offloading this to the server (which already handles video cutting/mixing) keeps the client lightweight and avoids browser memory limits.
-   **High ROI:** Small technical effort for a massive boost in shareability.

### 📊 Research Findings

**Technology Analysis:**
-   **Library/Framework:** FFmpeg (`showwaves` filter)
-   **Maturity:** Highly stable.
-   **Performance:** Generating a waveform is significantly faster than standard video encoding since the visual complexity is low. My POC generated a 3-second audiogram in ~1.5s on a basic CPU.
-   **Bundle size:** No impact on frontend. Negligible impact on backend (just new FFmpeg commands).

**Competitive Analysis:**
-   **Descript, Riverside, OpusClip:** All offer audiogram generation. It's a standard feature for podcast clipping tools.

**Best Practices:**
-   Use `libx264` with `fast` or `veryfast` preset for quick generation without losing much quality for simple waveforms.
-   Keep the resolution standard (e.g., 720p or 1080p) to satisfy social media requirements.

### 🧪 Proof of Concept

**Implementation:**
See `research/pocs/audiogram_poc.js` for the working Node.js script.

```javascript
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

// ... setup audio path and output video path

const ffmpeg = spawn(ffmpegPath, [
    '-i', audioPath,
    '-filter_complex', '[0:a]showwaves=s=1280x720:mode=cline:colors=white:rate=25[v]',
    '-map', '[v]',
    '-map', '0:a',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-c:a', 'aac',
    '-y',
    videoPath
]);
```

**Performance:**
-   A 3-second audio clip was converted to an audiogram video in ~1584ms locally.

### 📈 Value Proposition

**Benefits:**
-   ✅ **Direct Social Sharing:** Users can immediately upload clips to TikTok/Reels without leaving the ecosystem.
-   ✅ **Increased Platform Value:** Reduces reliance on external tools.
-   ✅ **Higher Engagement:** Visual waveforms retain viewer attention better than static images on social media.

**User stories:**
-   As a podcaster, I can download my audio highlights as videos with waveforms so that I can immediately post them to Instagram Reels.

### ⚖️ Trade-offs

**Pros:**
-   ✅ High user value.
-   ✅ Leverages existing infrastructure (`ffmpeg-service`).

**Cons:**
-   ❌ Increases CPU load on the backend server compared to simple audio cutting.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side Canvas rendering & WebM export | Zero server cost | High complexity, poor mobile support, slow on old devices | Not chosen because server already has FFmpeg. |
| Third-party API (e.g., Cloudinary) | Easy to implement | High recurring cost, vendor lock-in | Not chosen to keep infrastructure unified and costs low. |

### 🛠️ Implementation Plan

**Phase 1: Backend Endpoint** (estimated: 1 day)
-   [ ] Add `/generate-audiogram` endpoint in `ffmpeg-service/src/index.ts`.
-   [ ] Implement FFmpeg `spawn` command with `showwaves` filter.
-   [ ] Add error handling and cleanup for temp files.

**Phase 2: Frontend Integration** (estimated: 1 day)
-   [ ] Add `generateAudiogram` function to `src/hooks/use-ffmpeg.ts` pointing to the new endpoint.
-   [ ] Update the highlight card UI to show a "Download as Video" button if the source is audio-only.

**Phase 3: Polish & Testing** (estimated: 0.5 days)
-   [ ] Test with different audio formats and lengths.
-   [ ] Verify the resulting MP4 on mobile devices.

**Total estimated effort:** 2.5 developer-days

**Dependencies:**
-   None (relies on existing `ffmpeg-static` in `ffmpeg-service`).

**Risks:**
-   ⚠️ **Server Load:** Generating many audiograms simultaneously could bottleneck the server.
    -   **Mitigation:** The service already uses `express-rate-limit`. We may need to tweak limits or implement a basic queue if usage spikes.

### 📚 Resources

**Documentation:**
-   [FFmpeg showwaves filter documentation](https://ffmpeg.org/ffmpeg-filters.html#showwaves)

### 🎬 Next Steps

**If approved:**
1.  Implement the backend endpoint in `ffmpeg-service`.
2.  Update the frontend `use-ffmpeg` hook to call the new endpoint.
3.  Add the UI button for "Download as Video (Audiogram)".
