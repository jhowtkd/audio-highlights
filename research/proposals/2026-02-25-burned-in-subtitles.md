## 🔬 Researcher: Server-Side Burned-In Subtitles

### 🎯 Executive Summary
Proposes implementing server-side subtitle burning using FFmpeg's `subtitles` filter in the `ffmpeg-service`. This allows users to export videos with hardcoded text (burned-in subtitles), which is essential for social media platforms like TikTok, Instagram Reels, and YouTube Shorts where users often watch videos on mute.

### 💡 Problem Statement
**Current situation:**
Currently, users can transcribe audio and cut clips, and they can download SRT/VTT files. However, if they want to post a clip to social media with subtitles, they have to use a third-party tool to merge the SRT and video.

**User impact:**
Content creators (our primary user base) lose time switching between apps to finish their workflow. It adds friction to the highlight export process.

**Example scenario:**
A user generates a 60-second highlight of a podcast. They want to upload it directly to Instagram Reels. Since our app only provides the video and an SRT file separately, they cannot upload it directly (Instagram doesn't support SRT uploads for Reels).

### 🚀 Proposed Solution
**What:**
Add an endpoint in the `ffmpeg-service` microservice to burn subtitles directly into the video stream.

**How it works:**
1. The client sends the video blob and the generated SRT text to the server.
2. The server saves the SRT to a temporary file.
3. The server runs FFmpeg with the `-vf subtitles=temp.srt` video filter.
4. The server returns the resulting MP4 blob to the client.

**Why this approach:**
Burning subtitles requires re-encoding the video stream. Doing this client-side via WebAssembly is too slow and resource-intensive for mobile devices or lower-end laptops. Offloading this to the server-side microservice leverages powerful server CPUs/GPUs and ensures consistent font rendering and speed.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `ffmpeg-static` via `child_process`
- **Maturity:** Highly stable
- **Adoption:** Industry standard for video processing
- **Community:** Massive FFmpeg community
- **License:** GPL (FFmpeg with libass)

**Competitive Analysis:**
- OpusClip: Provides highly stylized burned-in subtitles.
- Riverside.fm: Allows exporting clips with customizable burned-in subtitles.

**Best Practices:**
- Use a standard font like Arial or Roboto, bundled with the server container.
- Consider supporting ASS (Advanced SubStation Alpha) format in the future for customized styling (colors, fonts, animations).

### 🧪 Proof of Concept

**Implementation:**
The POC in `research/pocs/burned_subtitles/poc.js` demonstrates generating a video and applying an SRT file using the `subtitles` filter.

```javascript
const { spawnSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

spawnSync(ffmpeg, [
    '-i', 'input.mp4',
    '-vf', 'subtitles=test.srt',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    'output.mp4'
]);
```

**Demo:**
Successfully generates a 5-second MP4 with the text rendered correctly.

**Performance:**
- Re-encoding adds processing time (roughly 0.5x to 1x real-time depending on server CPU).

### 📈 Value Proposition

**Benefits:**
- ✅ **Complete Workflow:** Users can go from long podcast to social-media-ready clip in one app.
- ✅ **Higher Engagement:** Videos with subtitles have significantly higher engagement rates on social media.
- ✅ **Server-Side Reliability:** Processing on the backend prevents client browser crashes on large files.

**User stories:**
- As a content creator, I can export my highlight with hardcoded subtitles so that I can upload it directly to TikTok without using another editing tool.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massively increases product value for social media creators.
- ✅ Leverages existing `ffmpeg-service` infrastructure.

**Cons:**
- ❌ Re-encoding video consumes significant CPU resources on the backend.
- ❌ Customizing subtitle styles (colors, fonts) is complex and requires switching from SRT to ASS format.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side WASM burning | No server costs | Too slow, crashes browser | Not chosen because performance is unacceptable. |
| Canvas overlay recording | Simple to implement | Loss of sync, lower quality | Not chosen because of quality issues. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Add `/burn-subtitles` endpoint in `ffmpeg-service`.
- [ ] Implement logic to write temporary SRT and video files.

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Add "Export with Subtitles" button in the frontend `highlight-card.tsx`.
- [ ] Connect frontend to the new endpoint.

**Phase 3: Polish & Testing** (estimated: 1 day)
- [ ] Add progress indicators.
- [ ] Handle error states and rate limiting.

**Total estimated effort:** 5 developer-days

**Dependencies:**
- `ffmpeg-static` (already installed in `ffmpeg-service`)

**Risks:**
- ⚠️ **Server Load:** High CPU usage could bottleneck the service. - Mitigation: Implement strict rate limiting and queuing (e.g., BullMQ) if adoption is high.

### 📚 Resources

**Documentation:**
- [FFmpeg Subtitles Filter](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)

### 🎬 Next Steps

**If approved:**
1. Implement the endpoint in `ffmpeg-service`.
2. Add the frontend UI.
3. Test with various video formats and aspect ratios.

**Questions to resolve:**
- [ ] Should we support custom font colors/styles in v1, or stick to default white text?

**Examples:**
- [FFmpeg Wiki: How to burn subtitles into video](https://trac.ffmpeg.org/wiki/HowToBurnSubtitlesIntoVideo)
- [Example Node.js implementation](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/882)

**Community:**
- [Stack Overflow discussions on FFmpeg subtitles](https://stackoverflow.com/questions/tagged/ffmpeg+subtitles)
- [FFmpeg User Mailing List](https://ffmpeg.org/contact.html)

### 💬 Discussion Points
- Should we attempt to use ASS subtitles for the MVP to allow users to pick a font color, or is SRT sufficient?
- Given the high CPU usage of video encoding, should this feature be restricted to a premium tier?
- Do we need to set a maximum duration for videos that can be exported with burned-in subtitles to prevent server lockups?
