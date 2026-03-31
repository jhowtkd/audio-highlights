## 🔬 Researcher: Server-Side Audiogram Generation

### 🎯 Executive Summary
I propose adding an **Audiogram Generator** feature to the `ffmpeg-service` and the main application. This feature automatically generates short, viral video clips (audiograms) with a waveform visualization and a static background image from audio highlights, directly addressing the needs of podcasters and creators sharing content on social media (Instagram Reels, TikTok, YouTube Shorts).

### 💡 Problem Statement
**Current situation:**
- The application identifies highlights and allows users to export audio clips or transcripts.
- However, audio clips alone perform poorly on social media platforms that prioritize video (like TikTok or Instagram Reels).
- Users currently have to take the exported audio into another tool (like Headliner, Canva, or Premiere) to create a video with a waveform.

**User impact:**
- High friction to share content on social media.
- Users drop off or switch tools to complete their workflow.
- Missed opportunity to provide a complete "end-to-end" viral clip solution.

**Example scenario:**
A user generates a great 30-second audio highlight. To share it on Instagram, they must export the MP3, open another app, upload a background image, add a waveform widget, sync it, and render a video.

### 🚀 Proposed Solution
**What:**
Enhance the `ffmpeg-service` with a new endpoint to generate audiograms.

**How it works:**
1.  **Input:** The endpoint accepts an audio file (the highlight) and an optional background image.
2.  **Processing:** It uses FFmpeg's `showwaves` complex filter to generate a dynamic waveform visualization from the audio stream and overlays it onto the background image (which is looped to match the audio duration).
3.  **Output:** Returns an MP4 video file optimized for social media.

**Why this approach:**
- **Server-Side Rendering:** Offloading to `ffmpeg-service` prevents client-side performance issues and browser memory limits that occur when trying to render video in the browser (e.g., using Canvas or Remotion).
- **Quality and Speed:** FFmpeg's native filters are highly optimized and produce professional-quality outputs quickly.
- **Integration:** Leverages the existing microservice architecture.

### 📊 Research Findings

**Technology Analysis:**
- **Tool:** FFmpeg `showwaves` and `overlay` filters.
- **Maturity:** Very Stable.
- **Performance:** Fast (approx real-time or faster depending on server capabilities).
- **Dependencies:** `ffmpeg-static` (Node.js) or system `ffmpeg` (already available).

**Competitive Analysis:**
- **Headliner:** Dedicated app for this exact use case.
- **Descript:** Offers built-in audiogram generation.
- **Our App:** Currently lacks a way to turn audio into video for social sharing.

### 🧪 Proof of Concept

**Implementation:**
The POC (`research/pocs/audiogram-poc.js`) demonstrates generating a waveform video from an audio file and a static background using `ffmpeg`.

```javascript
// FFmpeg filter complex logic
const filterComplex = '[1:a]showwaves=s=1080x400:colors=White:mode=cline,format=yuva420p[wave];[0:v][wave]overlay=0:(H-h)/2[outv]';

const args = [
    '-loop', '1', '-i', bgImagePath,
    '-i', audioPath,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-map', '1:a',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-shortest', // Stop encoding when the shortest stream (audio) ends
    outputPath
];
// spawn ffmpeg...
```

**Demo:**
The POC successfully generates a 1080x1920 MP4 video with a white waveform overlaid on a dark blue background, perfectly synced to the audio.

**Performance:**
- Rendering a short clip is extremely fast using `libx264` and `fast` preset.

### 📈 Value Proposition

**Benefits:**
- ✅ **Complete Workflow:** Users can go from long podcast to viral social media video in one app.
- ✅ **High Engagement:** Audiograms significantly increase engagement compared to static posts with audio links.
- ✅ **Monetization/Growth:** A highly demanded feature that can attract more creators.

**User stories:**
- As a **Podcaster**, I want to **generate a video with a waveform from my audio highlight** so that **I can easily post it to Instagram Reels.**

### ⚖️ Trade-offs

**Pros:**
- ✅ High value for the "Viral" use case.
- ✅ Leverages existing FFmpeg server-side capabilities.
- ✅ Reliable and robust (no browser OOM issues).

**Cons:**
- ❌ **Server Load:** Video encoding (`libx264`) is CPU-intensive. May require scaling the `ffmpeg-service` if usage is high.
- ❌ **Customization:** Initial MVP might have limited customization (e.g., fixed waveform color/position) compared to dedicated tools.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side (Remotion) | Highly customizable | Heavy client load, complex setup | Not chosen |
| Client-side (Canvas) | No server cost | OOM errors, tricky syncing | Not chosen |

### 🛠️ Implementation Plan

**Phase 1: Service Update** (estimated: 2 days)
- [ ] Add `POST /generate-audiogram` to `ffmpeg-service`.
- [ ] Implement FFmpeg spawn logic with `showwaves` filter.
- [ ] Add basic validation for inputs (audio, optional image).

**Phase 2: Frontend Integration** (estimated: 2 days)
- [ ] Add "Export as Video (Audiogram)" option to `HighlightCard` or export menu.
- [ ] Create a simple UI to select a background image or use a default gradient.
- [ ] Handle the request and file download.

**Phase 3: Polish** (estimated: 1 day)
- [ ] Add basic options for waveform color or layout (e.g., vertical vs square).

**Total estimated effort:** 5 developer-days

**Dependencies:**
- `ffmpeg` (server-side)

### 📚 Resources

**Documentation:**
- [FFmpeg showwaves documentation](https://ffmpeg.org/ffmpeg-filters.html#showwaves)

### 🎬 Next Steps

**If approved:**
1.  Implement the `/generate-audiogram` endpoint in `ffmpeg-service`.
2.  Design the UI for the export options.
