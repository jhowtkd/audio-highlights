## 🔬 Researcher: Hardcoded (Burned-in) Subtitles for Video Clips

### 🎯 Executive Summary
Propose adding a feature to the `ffmpeg-service` that automatically burns (hardcodes) subtitles into the generated video highlights. This is crucial for social media platforms like TikTok, Instagram Reels, and YouTube Shorts, where a majority of users watch videos on mute.

### 💡 Problem Statement
**Current situation:**
The application generates video highlights (clips) and can export SRT/VTT subtitle files separately. However, it does not embed the subtitles directly into the video file itself.

**User impact:**
- **Friction:** Users must use a third-party editor (like CapCut or Premiere) to import the video and the SRT file just to combine them.
- **Accessibility/Engagement:** Videos without hardcoded subtitles perform poorly on social media platforms because most users scroll with audio off.

**Example scenario:**
A user generates a great 60-second highlight. To post it to TikTok, they have to download the MP4, download the SRT, open CapCut on their phone, import both, align them (if not aligned automatically), and export again.

### 🚀 Proposed Solution
**What:**
Enhance the `ffmpeg-service` with a new endpoint or an additional flag on existing endpoints to support subtitle burning using the FFmpeg `subtitles` filter.

**How it works:**
1. The frontend sends the video file (or segments) and the corresponding SRT content to the `ffmpeg-service`.
2. The service saves the SRT content to a temporary file.
3. The service runs FFmpeg with the `-vf subtitles=path/to/file.srt` filter to hardcode the text onto the video frames.
4. The service returns the processed video with burned-in subtitles.

**Why this approach:**
- **Zero Additional Dependencies:** FFmpeg natively supports the `subtitles` video filter.
- **Server-Side Rendering:** Burning subtitles requires re-encoding the video, which is CPU-intensive and best suited for the `ffmpeg-service` rather than client-side WebAssembly.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg `subtitles` video filter (`-vf subtitles=...`).
- **Maturity:** Highly stable and widely used in the industry.
- **Performance:** Slower than `stream copy` because it requires video re-encoding, but essential for the final social-media-ready export.

**Competitive Analysis:**
- **OpusClip, Munch, Descript:** All these competitors offer burned-in, styled subtitles as a core feature of their highlight generation.

**Best Practices:**
- Important technical detail: When passing absolute file paths to the `subtitles` filter, the path must be properly escaped. Windows paths (with `\`) and colons (`:`) in paths can cause FFmpeg to fail parsing the filter graph.

### 🧪 Proof of Concept

**Implementation:**
A POC script (`research/pocs/subtitle-burn-poc.js`) was created and verified to successfully burn subtitles onto a generated test video.

```javascript
// snippet from research/pocs/subtitle-burn-poc.js
const escapedSubtitlePath = subtitleFile.replace(/\\/g, '/').replace(/:/g, '\\:');
const args = [
    '-i', inputVideo,
    '-vf', `subtitles=${escapedSubtitlePath}`,
    '-c:a', 'copy',
    '-y', outputVideo
];
const child = spawn(ffmpegPath, args);
```

**Demo:**
The POC generated a 5-second red video and successfully burned standard SRT subtitles onto it in ~1.9 seconds.

**Performance:**
- Re-encoding video will increase processing time compared to the current fast `stream copy` approach, but it is an accepted trade-off for the final polished output.

### 📈 Value Proposition

**Benefits:**
- ✅ **All-in-One Solution:** Users can go straight from our app to social media without intermediate editing.
- ✅ **Higher Engagement:** Videos with subtitles perform significantly better on social platforms.
- ✅ **Value-Add:** Positions the tool as a complete publishing pipeline, not just a clipping tool.

### ⚖️ Trade-offs

**Pros:**
- ✅ Solves a massive user pain point.
- ✅ Leverages existing FFmpeg infrastructure.

**Cons:**
- ❌ **Slower Processing:** Video re-encoding takes time (often 0.5x to 1x real-time depending on server CPU).
- ❌ **Styling Limitations:** Basic `subtitles` filter uses default SRT styles. (Advanced styling like word-by-word highlighting requires ASS format or complex filter graphs).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| WebAssembly (Client) | Saves server CPU | Too slow for video re-encoding on most devices | Not chosen |
| ASS format subtitles | Advanced styling (colors, fonts) | Complex to generate | Defer to Phase 2. Start with SRT. |

### 🛠️ Implementation Plan

**Phase 1: Backend Support (SRT)** (estimated: 2 days)
- [ ] Add `POST /burn-subtitles` to `ffmpeg-service` (accepts video + SRT).
- [ ] Ensure path escaping for the `subtitles` filter (using `.replace(/\\/g, '/').replace(/:/g, '\\:')`).

**Phase 2: Frontend Integration** (estimated: 1 day)
- [ ] Add "Burn Subtitles" toggle to the export/download modal.
- [ ] Generate the SRT string on the client and send it along with the video to the backend service.

**Total estimated effort:** 3 developer-days

**Dependencies:**
- Existing `ffmpeg-static` or system FFmpeg with `--enable-libass` (standard in most builds).

**Risks:**
- ⚠️ **Server Load:** Re-encoding is heavy.
  - *Mitigation:* Implement rate limiting and queueing on the `ffmpeg-service` if usage spikes.
- ⚠️ **Path Parsing Error:** FFmpeg filter graph fails if path is not escaped.
  - *Mitigation:* Apply proper path escaping as discovered during research.

### 📚 Resources

**Documentation:**
- [FFmpeg subtitles filter documentation](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

### 🎬 Next Steps

**If approved:**
1. Update `ffmpeg-service` to include the `burn-subtitles` endpoint.
2. Prototype the frontend toggle.