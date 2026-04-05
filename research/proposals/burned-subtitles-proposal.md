## 🔬 Researcher: Server-Side Burned-in Subtitles for Viral Clips

### 🎯 Executive Summary
Implement server-side subtitle burning for exported video highlights using FFmpeg. This adds immense value by providing ready-to-publish viral clips (like Instagram Reels, TikTok, YouTube Shorts) directly from the application without needing third-party editors like Premiere or CapCut.

### 💡 Problem Statement
**Current situation:**
Currently, the application allows exporting highlights as raw video clips (`MP4`) and subtitles as text/SRT files. To create a viral video, users must download both files and combine them manually in a video editor.

**User impact:**
Content creators are heavily impacted, losing minutes per clip just to add subtitles. For high-volume producers, this friction point may drive them to all-in-one competitors like OpusClip or Captions.ai.

**Example scenario:**
A user generates 5 highlights from a 1-hour podcast. They want to post them immediately to TikTok. Right now, they have to download 5 videos and 5 SRT files, import them one by one into an editor, style the subtitles, export again, and then publish.

### 🚀 Proposed Solution
**What:**
Add a new export option: "Download Video with Subtitles (Ready for Social Media)". This uses the existing `ffmpeg-service` (or a local instance) to hardcode (burn) the SRT subtitles directly onto the video frames.

**How it works:**
1. User clicks "Export with Subtitles".
2. The client sends the video segment timestamps and the corresponding SRT content to the backend.
3. The server generates a temporary `.srt` file.
4. FFmpeg is called using the `subtitles` video filter (`-vf subtitles=path/to.srt`) during the clipping process or in a subsequent pass.
5. The processed MP4 with burned-in subtitles is returned to the user.

**Why this approach:**
It leverages our existing FFmpeg infrastructure. The `subtitles` filter in FFmpeg is highly optimized and standard for this exact use case.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `fluent-ffmpeg` and `ffmpeg` (with `libass` compiled in).
- **Maturity:** Highly Stable.
- **Adoption:** Industry standard for automated video processing.
- **Community:** Massive.
- **License:** GPL (FFmpeg).
- **Bundle size:** No client-side bundle impact (Server-side operation).

**Competitive Analysis:**
- **OpusClip / Veed / Captions.ai:** All provide burned-in, styled subtitles as their core value proposition.
- **Our App:** Currently requires manual assembly.

**Best Practices:**
To make them look like modern viral clips, we can eventually extend this to use custom ASS subtitle styles (fonts, colors, background boxes) instead of raw SRT, but raw SRT burning is the necessary first step.

### 🧪 Proof of Concept

**Implementation:**
```javascript
// research/pocs/burned-subtitles/poc.js
const ffmpeg = require('fluent-ffmpeg');
const inputVideo = 'dummy.mp4';
const inputSubtitles = 'dummy.srt';
const outputVideo = 'output.mp4';

// Note: Paths in FFmpeg filters need special escaping
const escapedSubtitlePath = inputSubtitles.replace(/\\/g, '/').replace(/:/g, '\\:');

ffmpeg(inputVideo)
    .videoFilters(`subtitles='${escapedSubtitlePath}'`)
    .output(outputVideo)
    .on('end', () => console.log('Done!'))
    .run();
```

**Demo:**
The POC was executed in `research/pocs/burned-subtitles/` and successfully burned `dummy.srt` into `dummy.mp4`, generating `output.mp4`.

**Performance:**
- Before: Video clipping was a fast stream copy (`-c copy`).
- After: Burning subtitles requires re-encoding the video track (`-c:v libx264`), which will be significantly slower and use more CPU.
- Impact: Processing time will increase. We need to measure if the Railway FFmpeg microservice can handle concurrent re-encoding requests.

### 📈 Value Proposition

**Benefits:**
- ✅ **Massive Time Saving:** Eliminates the need for external video editors.
- ✅ **Competitive Parity:** Matches core features of dedicated AI clipping tools.
- ✅ **Higher Retention:** Users stay in our ecosystem end-to-end.

**User stories:**
- As a content creator, I can download a ready-to-post MP4 with subtitles so that I can immediately publish it to TikTok from my phone.

### ⚖️ Trade-offs

**Pros:**
- ✅ Extremely high perceived value by users.
- ✅ Uses existing FFmpeg infrastructure.

**Cons:**
- ❌ Requires video re-encoding (cannot use `-c copy`), increasing CPU load and processing time.
- ❌ Hardcoded subtitles cannot be turned off by the viewer.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side rendering (Canvas) | Zero server cost | Extremely complex, memory intensive, slow | Not chosen because of stability issues |
| WebCodecs API | Modern, fast | Bleeding edge, browser compatibility issues | Not chosen because of lack of ecosystem |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Create a new endpoint `/api/export-burned` in the FFmpeg microservice.
- [ ] Implement the `fluent-ffmpeg` script to accept video, start/end times, and SRT payload.

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Update frontend `Export` menu to include "Video com Legendas".
- [ ] Wire up the UI to call the new microservice endpoint.
- [ ] Add loading states and progress indicators (since this will take longer than standard cuts).

**Phase 3: Polish & Testing** (estimated: 1 day)
- [ ] Test on varying video lengths.
- [ ] Explore custom styling via `.ass` conversion instead of `.srt` for better aesthetics.

**Total estimated effort:** 5 developer-days

**Dependencies:**
- Existing FFmpeg service must have `libass` enabled (most standard builds do).

**Risks:**
- ⚠️ **Server Load:** Re-encoding is expensive. - Mitigation: Implement queueing/rate limiting on the FFmpeg service, or use lower resolution/bitrate for exports.

### 📚 Resources

**Documentation:**
- [FFmpeg Subtitles Filter](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)
- [fluent-ffmpeg Filters](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg#video-filters)

### 🎬 Next Steps

**If approved:**
1. Check if the Railway FFmpeg image supports the `subtitles` filter (requires `libass`).
2. Prototype the backend endpoint in the microservice.
3. Integrate into the frontend UI.

### 💬 Discussion Points
- Should we charge a premium (or require higher tiers) for burned-in subtitles due to the increased server costs?
- Should we allow users to pick fonts/colors, or provide one standard "viral" style?