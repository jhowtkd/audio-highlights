## 🔬 Researcher: Server-Side Subtitles Support

### 🎯 Executive Summary
Propose adding a "Burn Subtitles" feature powered by the `ffmpeg-service`. This allows users to bake `.srt` captions directly into their exported videos, solving a major pain point for content creators who need ready-to-publish videos for social media.

### 💡 Problem Statement
**Current situation:**
- The application generates `.srt` and `.vtt` subtitle files, but users have to use external tools (like Premiere or Handbrake) to burn them into the video.
- Client-side `@ffmpeg/ffmpeg` standard WASM builds often lack the `libass` library required for the `subtitles` filter.

**User impact:**
- Users experience a fragmented workflow.
- High friction when trying to quickly export a highlighted clip for social media where auto-playing without sound (hence needing subtitles) is standard.

**Example scenario:**
- A user generates a 60-second highlight of a podcast. They want to post it to Instagram Reels. They have the video and the `.srt`, but can't combine them on the platform.

### 🚀 Proposed Solution
**What:**
Enhance the `ffmpeg-service` with a new endpoint to burn subtitles.
1. `POST /burn-subtitles`: Accepts a video file and `.srt` file/text, returning a processed video with burned-in subtitles.

**How it works:**
- Uses the `subtitles` video filter in FFmpeg to render the `.srt` text onto the video frames.
- This requires full video re-encoding (cannot use stream copy `-c copy`), so it should be processed server-side.

**Why this approach:**
- **Feasibility:** `ffmpeg-static` supports the `subtitles` filter (via `libass`) on the backend.
- **Reliability:** Bypasses browser limitations and WASM build constraints of client-side FFmpeg.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg `subtitles` filter.
- **Dependencies:** `ffmpeg-static` (Node.js) which includes `libass`. Note: The `drawtext` filter fails despite `libfreetype` being enabled, making `subtitles` the required path.
- **Performance:** Requires re-encoding, so processing time is roughly 1-2x real-time depending on server CPU and output resolution.

### 🧪 Proof of Concept

**Implementation:**
The POC demonstrates burning an `.srt` file into a video using `ffmpeg-static`.

```javascript
// See research/pocs/subtitles-support-poc.js for full code
const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');

const args = [
    '-y',
    '-i', 'input.mp4',
    '-vf', 'subtitles=subs.srt',
    'output.mp4'
];
spawn(ffmpeg, args);
```

**Performance:**
- Requires video re-encoding.
- Processing time depends on video length and resolution.

### 📈 Value Proposition

**Benefits:**
- ✅ **All-in-one Workflow:** Users don't need to leave the app to get a final, publishable video.
- ✅ **Social Media Ready:** Essential feature for TikTok, Reels, and Shorts.

**User stories:**
- As a **Content Creator**, I can **export my video with burned-in subtitles** so that **I can directly upload it to social media without using another editor.**

### ⚖️ Trade-offs

**Pros:**
- ✅ High demand feature.
- ✅ High quality text rendering (libass supports styling via ASS if we upgrade later).

**Cons:**
- ❌ Requires server-side re-encoding, which is CPU intensive.
- ❌ Slower than stream copying.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side FFmpeg | No server cost | Standard WASM lacks libass | Not chosen |
| HTML Canvas rendering | Fast | Hard to sync with video export | Not chosen |

### 🛠️ Implementation Plan

**Phase 1: Service Update** (estimated: 2 days)
- [ ] Add `POST /burn-subtitles` to `ffmpeg-service`.
- [ ] Implement temporary file handling for the `.srt` payload.

**Phase 2: Frontend Integration** (estimated: 2 days)
- [ ] Add "Burn Subtitles" toggle in the export modal.
- [ ] Connect export action to the new service endpoint.

**Total estimated effort:** 4 developer-days
