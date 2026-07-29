## 🔬 Researcher: Server-Side Subtitle Burning (Hardsubs)

### 🎯 Executive Summary
Add the ability to burn subtitles directly into the exported video highlights (hardsubs) using the existing FFmpeg microservice. This is a critical feature for users wanting to share clips directly to platforms like TikTok, Instagram Reels, and YouTube Shorts where baked-in subtitles are standard.

### 💡 Problem Statement
**Current situation:**
Currently, users can generate and export video clips using the `ffmpeg-service` microservice, and they can download SRT/TXT files separately. However, they must use a third-party tool (like Premiere, CapCut, or Veed) to combine the video and subtitles before posting to social media.

**User impact:**
Content creators (the primary audience for this app) lose significant time jumping between tools. A large percentage of users watching short-form content do so with sound off, making subtitles mandatory.

**Example scenario:**
A user generates a viral 60-second highlight of their podcast. They download the MP4 and the SRT file. They then have to open CapCut on their phone or PC, import both files, style them, and re-export the video before they can post it to TikTok.

### 🚀 Proposed Solution
**What:**
Enhance the `ffmpeg-service` microservice to accept subtitle data (either as a string or a file), generate an SRT file temporarily on the server, and use FFmpeg's `subtitles` filter to burn the text into the video frames during the clipping process.

**How it works:**
1. Frontend sends the highlight's start/end times and its specific segments to `ffmpeg-service`.
2. `ffmpeg-service` generates a temporary `.srt` file for the requested duration.
3. `ffmpeg-service` uses the `subtitles=<path>` video filter (`-vf`).
4. Since video filters require re-encoding, the command will change from `-c:v copy` to `-c:v libx264 -preset fast`. Audio can still be `-c:a copy`.

**Why this approach:**
Using FFmpeg on the backend provides the highest reliability and performance compared to client-side WASM approaches (which are slow and memory-intensive for video encoding). The infrastructure (Railway Docker service) is already in place.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg (`subtitles` filter)
- **Maturity:** Stable (Industry standard)
- **Dependencies:** Requires the video to be re-encoded.
- **Complexity:** Medium (Path escaping for FFmpeg filters can be tricky).

**Competitive Analysis:**
- **OpusClip / Veed:** All provide burned-in subtitles with various styling options out of the box. This is considered a baseline feature for AI clipping tools.

**Best Practices:**
- The absolute path to the subtitle file must be escaped in Node.js before being passed to FFmpeg (e.g., `.replace(/\\/g, '/').replace(/:/g, '\\:')`).

### 🧪 Proof of Concept

**Implementation:**
```typescript
// research/pocs/burned-subtitles-poc.ts
import { spawn } from 'child_process';

export async function burnSubtitles(videoPath: string, srtPath: string, outputPath: string) {
  // FFmpeg requires absolute paths for the subtitles filter to be properly escaped
  const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');

  const ffmpegArgs = [
    '-y',
    '-i', videoPath,
    '-vf', `subtitles=${escapedSrtPath}`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-c:a', 'copy',
    outputPath,
  ];

  const ffmpeg = spawn('ffmpeg', ffmpegArgs);
  // ... handle streams and close events
}
```

### 📈 Value Proposition

**Benefits:**
- ✅ **Massive Time Saving:** Creators can go straight from AudioHighlights to TikTok/Reels.
- ✅ **Increased Product Value:** Moves the app from a "helper tool" to an end-to-end publishing pipeline.
- ✅ **Competitive Parity:** Matches features found in premium AI clipping tools.

**User stories:**
- As a content creator, I can download a video clip with subtitles already burned in so that I can immediately post it to social media without using external editors.

### ⚖️ Trade-offs

**Pros:**
- ✅ Seamless user experience.
- ✅ Uses existing FFmpeg microservice architecture.

**Cons:**
- ❌ **Slower Processing:** We can no longer use `-c copy` (stream copy) for the video. Re-encoding video takes significantly more CPU and time.
- ❌ **Server Costs:** Higher CPU usage on the Railway microservice might lead to higher infrastructure costs.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side FFmpeg.wasm | No server cost | Extremely slow on client, high memory usage, crashes on mobile | Not chosen because it ruins the fast UX. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 day)
- [ ] Add endpoint in `ffmpeg-service` that accepts SRT content alongside video/audio data.
- [ ] Implement temporary file handling for the SRT file.

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Implement the FFmpeg `-vf subtitles=...` logic.
- [ ] Test with different video aspect ratios and formats.

**Phase 3: Polish & Testing** (estimated: 1 day)
- [ ] Update frontend UI to allow users to toggle "Burn Subtitles" on download.
- [ ] Add styling options (font, size, colors) if possible via ASS subtitles later.

**Total estimated effort:** 4 developer-days

**Dependencies:**
- Existing FFmpeg Docker setup (no new dependencies needed, just changing commands).

**Risks:**
- ⚠️ Processing time becomes too slow for users. - Mitigation: Provide clear UI loading states and use `-preset fast` or `-preset veryfast`.

### 📚 Resources

**Documentation:**
- [FFmpeg Subtitles Filter Documentation](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

### 🎬 Next Steps

**If approved:**
1. Create a branch for `ffmpeg-service` updates.
2. Implement the new endpoint and test locally.
3. Update frontend to send SRT content during export.

### 💬 Discussion Points
- Should we allow users to customize the font/color of the subtitles, or stick to a default style for v1?
- Are we concerned about the increased CPU load on our current Railway plan?
