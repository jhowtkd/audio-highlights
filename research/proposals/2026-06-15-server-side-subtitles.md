## 🔬 Researcher: Server-Side Burned-in Subtitles (Hardsubs)

### 🎯 Executive Summary
I propose implementing server-side video subtitle burn-in (hardsubs) using the backend `ffmpeg-service`. This will allow users to export short viral clips (TikTok/Reels) with burned-in subtitles directly from the application, resolving current limitations with client-side FFmpeg WASM.

### 💡 Problem Statement
**Current situation:**
The application generates highly engaging highlights and exports `.srt` subtitle files. However, users must use external software (like CapCut or Premiere) to burn these subtitles into the video for platforms like TikTok or Instagram Reels.

**User impact:**
Content creators experience a fragmented workflow. Forcing them to leave the application to finalize a viral clip adds significant friction and reduces the perceived value of the tool.

**Example scenario:**
A user generates a perfect 60-second highlight of a podcast. To post it to TikTok, they download the MP4 and the SRT, open CapCut on their phone, import both, adjust styling, export, and then upload.

### 🚀 Proposed Solution
**What:**
Add an endpoint in the `ffmpeg-service` (backend) to accept a video file, an SRT/ASS subtitle string, and styling parameters, returning a video with burned-in subtitles.

**How it works:**
1. The frontend generates the highlight video (or passes the timestamps).
2. The frontend sends the video/timestamps and the generated subtitle content to a new `/burn-subtitles` endpoint on the `ffmpeg-service`.
3. The `ffmpeg-service` uses `ffmpeg-static` to write the subtitle content to a temporary file (`.ass` format for styling support).
4. The service applies the `subtitles` filter (e.g., `-vf "subtitles=temp.ass"`) and fully re-encodes the video, returning the final MP4.

**Why this approach:**
Client-side FFmpeg (`@ffmpeg/ffmpeg` WASM) lacks support for the `libass` library needed for the `subtitles` filter. While the backend `ffmpeg-static` supports `subtitles`, it fails with the `drawtext` filter. Therefore, using the `subtitles` filter with a temporary file on the backend is the only viable path for native hardsubs in this architecture.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `ffmpeg-static` (backend service)
- **Maturity:** Stable
- **Limitations:** Applying the `subtitles` video filter requires full video re-encoding and cannot be used in conjunction with stream copying (`-c copy`). This results in significant processing overhead. Also, `drawtext` fails on `ffmpeg-static` despite `libfreetype` being enabled.

**Competitive Analysis:**
- **OpusClip / Munch:** Offer stylized, animated burned-in subtitles automatically.
- **Descript:** Allows native export with burned-in subtitles and custom styles.

**Best Practices:**
- Use the `.ass` (Advanced SubStation Alpha) format instead of `.srt` when passing to the `subtitles` filter to allow for advanced styling (fonts, colors, background boxes).

### 🧪 Proof of Concept

**Implementation:**
```javascript
// ffmpeg-service/src/subtitle-poc.js
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

function burnSubtitles(inputPath, assFilePath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      // Must re-encode, cannot use -c copy
      .videoCodec('libx264')
      .audioCodec('aac')
      // Apply subtitles filter
      .outputOptions([`-vf subtitles=${assFilePath}`])
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });
}
```

**Performance:**
- Before: Stream copy (instant).
- After: Full re-encode (takes approx. 0.5x - 1x the duration of the clip depending on server CPU).
- Impact: Substantial processing regression, but necessary for the feature.

### 📈 Value Proposition

**Benefits:**
- ✅ End-to-end workflow within the application.
- ✅ Higher conversion rate to published content.
- ✅ Differentiation from simple transcription tools.

**User stories:**
- As a content creator, I can export an MP4 with burned-in captions so that I can immediately upload it to TikTok without secondary editing.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massively improves user workflow and product value.
- ✅ Solves the client-side WASM limitation elegantly.

**Cons:**
- ❌ High CPU cost on the Railway backend (requires re-encoding).
- ❌ Increased wait time for the user during export.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side WASM `drawtext` | Zero server cost | Extremely slow, unreliable, lacks styling | Not chosen because of WASM limitations |
| HTML5 Canvas recording | Accurate to UI | Very complex to synchronize, fragile | Not chosen because of complexity |

### 🛠️ Implementation Plan

**Phase 1: Backend Implementation** (estimated: 2 days)
- [ ] Add `/burn-subtitles` endpoint to `ffmpeg-service`.
- [ ] Implement robust temporary file handling for `.ass` files.
- [ ] Implement the FFmpeg pipeline with `libx264` re-encoding.

**Phase 2: Frontend Integration** (estimated: 2 days)
- [ ] Add "Export with Subtitles" button to the highlight export options.
- [ ] Convert highlight transcript segments to `.ass` format with styling.
- [ ] Handle long-polling or progress state during backend processing.

**Phase 3: Polish & Testing** (estimated: 1 day)
- [ ] Optimize re-encoding settings for fast export vs quality (e.g., `preset=fast`).
- [ ] Handle concurrent requests on the backend.

**Total estimated effort:** 5 developer-days

**Dependencies:**
- `ffmpeg-static`
- `fluent-ffmpeg`

**Risks:**
- ⚠️ Backend CPU overload. - Mitigation: Implement queueing/rate-limiting on the `ffmpeg-service`.

### 📚 Resources

**Documentation:**
- FFmpeg Subtitles Filter: https://ffmpeg.org/ffmpeg-filters.html#subtitles-1
- ASS Format Spec: http://www.tcax.org/docs/ass-specs.htm

### 🎬 Next Steps

**If approved:**
1. Provision a staging environment for `ffmpeg-service` with higher CPU limits to test encoding times.
2. Develop the backend endpoint and verify subtitle styling support.

### 💬 Discussion Points
- Given the CPU cost of re-encoding, should this be a premium-only feature?
