## 🔬 Researcher: Server-Side Subtitle Burn-In (Hardsubs)

### 🎯 Executive Summary
I propose adding a server-side subtitle burn-in feature (hardsubs) using FFmpeg to generated video clips. Currently, we can generate clips, but the user has to export the video and the SRT separately, then use another tool (like Premiere or CapCut) to add the text to the video. Automating this server-side will instantly generate "viral-ready" clips for platforms like TikTok or Reels directly from the app.

### 💡 Problem Statement
**Current situation:**
The application generates video highlights based on transcription analysis, but these are raw cut clips. If a user wants text on screen (which is mandatory for modern short-form content), they must use external software.

**User impact:**
Users experience a broken workflow. They get 80% of the way there (finding the clip), but the final 20% (making it publishable) requires switching apps.

**Example scenario:**
A creator uses AudioHighlights to find the 3 best 60-second moments from a 2-hour podcast. They download the 3 MP4s and 3 SRTs. Now they have to open CapCut, import the video, import the SRT, style it, and re-export.

### 🚀 Proposed Solution
**What:**
Enhance the existing `ffmpeg-service` (or local FFmpeg execution) to accept an SRT file (or raw segment data) and burn it directly onto the video using the FFmpeg `-vf subtitles` filter.

**How it works:**
1.  **Frontend:** User selects "Export with Subtitles" and configures basic styling (font size, color).
2.  **Backend/Service:** When FFmpeg cuts the video, it also applies a video filter: `-vf "subtitles=temp.srt:force_style='FontSize=24,PrimaryColour=&H00FFFF'"`
3.  **Result:** The output MP4 has the text permanently baked in, perfectly synced with the audio.

**Why this approach:**
-   **Reliability:** FFmpeg's `subtitles` filter is rock-solid for syncing text to video compared to trying to draw it on an HTML `<canvas>` and recording the screen client-side.
-   **Performance:** We already use FFmpeg for cutting. Adding a filter during the same pass is efficient.

### 📊 Research Findings

**Technology Analysis:**
-   **Library/Tool:** FFmpeg (`ffmpeg-static` for Node, or system `ffmpeg` in Docker).
-   **Feature:** `-vf subtitles` (requires libass).
-   **Performance:** Re-encoding video (`libx264`) is required when burning subtitles (cannot use `-c:v copy`), which will increase processing time compared to simple cuts.

**Competitive Analysis:**
-   OpusClip, Munch, and Descript all provide auto-captioned, ready-to-post videos. It is the expected standard.

**Best Practices:**
-   Provide options for "TikTok style" (large, centered, high contrast).

### 🧪 Proof of Concept

**Implementation:**
A POC script is available at `research/pocs/subtitle-burn-in-poc.js`. It generates a dummy video, a dummy SRT, and successfully burns the subtitles into a final video.

```javascript
// Core FFmpeg command from the POC:
spawn(ffmpegStatic, [
    '-i', 'dummy_video.mp4',
    '-vf', "subtitles=dummy_sub.srt:force_style='FontSize=36,PrimaryColour=&H00FFFF,BorderStyle=1,Outline=2,Shadow=1,MarginV=40'",
    '-c:a', 'copy',
    '-c:v', 'libx264',
    '-preset', 'ultrafast', // crucial for fast processing
    '-y',
    'output_with_subs.mp4'
]);
```

**Demo:**
Run `node research/pocs/subtitle-burn-in-poc.js` to see the generated `output_with_subs.mp4`.

**Performance:**
-   Since this requires re-encoding, it is slower than the current `stream copy` cut. Using `-preset ultrafast` helps significantly.

### 📈 Value Proposition

**Benefits:**
-   ✅ **Complete Workflow:** Users can go from long podcast to final TikTok clip in one app.
-   ✅ **High Value:** This is a premium feature that differentiates simple trimmers from full AI editors.

**User stories:**
-   As a marketer, I want to download a clip with subtitles already on it so I can immediately post it to Instagram Reels.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Perfect sync guaranteed by FFmpeg.
-   ✅ Highly customizable styling via `force_style`.

**Cons:**
-   ❌ **Processing Time:** Requires re-encoding the video (`-c:v libx264`), which is CPU intensive and slower than stream copying.
-   ❌ **Environment:** Requires FFmpeg compiled with `libass` support (usually standard, but needs verification in production docker image).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side Canvas Recording | No server cost | Very buggy, prone to desync, memory intensive | Not chosen because reliability is paramount. |

### 🛠️ Implementation Plan

**Phase 1: FFmpeg Service Integration** (estimated: 2 days)
-   [ ] Verify `ffmpeg-service` Docker image has `libass` support.
-   [ ] Add new endpoint `/burn-subtitles` that accepts video file and SRT data.

**Phase 2: Frontend Integration** (estimated: 1 day)
-   [ ] Add UI toggle for "Burn Subtitles" in the export modal.
-   [ ] Call the new service endpoint.

**Phase 3: Polish** (estimated: 1 day)
-   [ ] Add style presets (TikTok style, Default, etc.).

**Total estimated effort:** 4 developer-days

### 🎬 Next Steps

**If approved:**
1.  Verify the FFmpeg build in the production environment.
2.  Begin Phase 1 to implement the backend service endpoint.
