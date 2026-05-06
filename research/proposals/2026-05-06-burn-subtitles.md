## 🔬 Researcher: Client-Side Burned-in Subtitles for Video Export

### 🎯 Executive Summary
Propose adding a feature to "burn" (hardcode) subtitles directly into the video when exporting a highlight. This uses the client-side FFmpeg integration to overlay the generated transcript onto the video, producing ready-to-share social media clips.

### 💡 Problem Statement
**Current situation:**
Currently, users can download the trimmed video and the SRT subtitle file separately.
**User impact:**
- Users have to use a third-party tool (like Premiere Pro, CapCut, or another website) to combine the video and the subtitles before posting to platforms like Instagram or TikTok.
**Example scenario:**
A creator generates a 30s highlight. They download `clip.mp4` and `clip.srt`. To post it as a Reel, they need to manually merge these files, disrupting the "one-click" workflow AudioHighlights aims to provide.

### 🚀 Proposed Solution
**What:**
Add a new export option: "Download Video with Subtitles" to the highlight card.
**How it works:**
1.  Generate the SRT content from the highlight's transcript.
2.  Write the SRT to the virtual filesystem in FFmpeg.wasm.
3.  Use the `subtitles` filter in the FFmpeg command when processing the video cut.
**Why this approach:**
It leverages the already loaded FFmpeg.wasm instance. It keeps the processing local (privacy-preserving and no server costs) and gives users the final product they need.

### 📊 Research Findings

**Technology Analysis:**
- **Library:** `@ffmpeg/ffmpeg` (FFmpeg.wasm)
- **Feasibility:** The `subtitles` filter is available in standard FFmpeg. FFmpeg.wasm supports it, provided the subtitle file is written to the virtual filesystem.
- **Performance:** Re-encoding the video is required to burn subtitles, so it will take longer than a simple `-c:v copy` cut. However, for short highlights (30s - 60s), this is usually acceptable on modern devices.

**Competitive Analysis:**
- **OpusClip / Munch:** Offer stylized, burned-in subtitles as their core value proposition.
- **Our App:** Adding basic burned-in subtitles bridges a major feature gap.

### 🧪 Proof of Concept

**Implementation:**
The POC demonstrated burning subtitles into a test video using a Node.js FFmpeg wrapper.

```javascript
// Virtual filesystem paths in FFmpeg.wasm
await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
await ffmpeg.writeFile('subs.srt', srtText);

await ffmpeg.exec([
    '-i', 'input.mp4',
    '-vf', "subtitles=subs.srt:force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1'",
    '-c:a', 'copy',
    'output.mp4'
]);
```

**Demo:**
The Node POC successfully generated a video with burned-in text.

**Performance:**
- Re-encoding time varies by device, but for 720p/1080p highlights of ~60s, it takes roughly 1x-2x realtime on a typical laptop.

### 📈 Value Proposition

**Benefits:**
- ✅ **Complete Workflow:** Users get a ready-to-publish video clip.
- ✅ **No Third-Party Tools:** Eliminates the need for external editors.

**User stories:**
- As a social media manager, I want to download a video with hardcoded subtitles so that I can immediately upload it to TikTok without extra editing steps.

### ⚖️ Trade-offs

**Pros:**
- ✅ High user value.
- ✅ No server costs (processed client-side).

**Cons:**
- ❌ **Processing Time:** Re-encoding takes longer than stream copying.
- ❌ **Font Limitations:** Styling is basic compared to dedicated video editors.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Server-side rendering | Faster on low-end devices | Expensive server compute | Not chosen (keep client-heavy architecture) |

### 🛠️ Implementation Plan

**Phase 1: FFmpeg Integration** (estimated: 1 day)
- [ ] Add `burnSubtitles` function to `use-ffmpeg.ts`.
- [ ] Handle SRT generation from `TranscriptionSegment[]` (which we already have in `export.ts`).

**Phase 2: UI Updates** (estimated: 1 day)
- [ ] Add "Download with Subtitles" button to `HighlightCard`.
- [ ] Show progress indicator during the re-encoding process.

**Total estimated effort:** 2 developer-days

### 📚 Resources

**Documentation:**
- [FFmpeg Subtitles Filter](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

### 🎬 Next Steps

**If approved:**
1. Implement the `burnSubtitles` method in the ffmpeg hook.
2. Update the UI to expose the new export option.
