## 🔬 Researcher: Server-Side Video Subtitle Burning (Hardsubs)

### 🎯 Executive Summary
Propose the addition of server-side subtitle burning (hardsubs) using FFmpeg to allow users to export ready-to-publish videos for social media without needing third-party editing tools.

### 💡 Problem Statement
**Current situation:**
The application generates great highlights and exports separate video (.mp4) and subtitle (.srt/.vtt) files. However, social media platforms like Instagram Reels and TikTok often require subtitles to be burned directly into the video for maximum engagement.

**User impact:**
Editors and creators are forced to download the video and SRT, then open a third-party tool like CapCut or Premiere Pro just to combine them. This breaks the seamless "one-click" workflow.

**Example scenario:**
A creator generates a 30-second viral clip. They want to post it immediately to Instagram from their phone, but Instagram doesn't support SRT uploads for Reels natively in all regions. They must use another app to burn the text.

### 🚀 Proposed Solution
**What:**
Add a "Burn Subtitles" option in the export menu that uses the `ffmpeg-service` to permanently render the generated SRT subtitles into the video file (hardsubbing).

**How it works:**
1. Frontend sends the video and generated SRT to the `ffmpeg-service`.
2. The service uses the FFmpeg `subtitles` filter (via `libass`) to render the text onto the video frames.
3. The resulting MP4 is streamed back to the client.

**Why this approach:**
`ffmpeg-static` already supports the `subtitles` filter via `libass`. This leverages our existing infrastructure to provide massive user value.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg (`ffmpeg-static` package)
- **Feature:** `subtitles` video filter (`-vf subtitles=file.srt`)
- **Maturity:** Stable industry standard
- **Performance:** Requires full video re-encoding (cannot use `-c copy`), resulting in significant processing overhead.
- **Limitation:** The `drawtext` filter fails in our environment despite `libfreetype` being enabled, making `subtitles` the only viable built-in option.

**Competitive Analysis:**
- OpusClip / Veed.io: Provide built-in hardsubs with custom styling.
- Descript: Renders captions during export.

**Best Practices:**
- Limit video resolution/framerate during rendering to keep processing times manageable.

### 🧪 Proof of Concept

**Implementation:**
```bash
# Generate the video with burned subtitles
ffmpeg -i input.mp4 -vf "subtitles=highlight.srt:force_style='FontName=Arial,FontSize=24,PrimaryColour=&H00FFFFFF'" -c:v libx264 -preset fast -crf 23 -c:a copy output_hardsub.mp4
```

**Demo:**
Testing locally confirmed that while stream copying is impossible, the `subtitles` filter functions correctly when the video is fully re-encoded.

**Performance:**
- Before: Near-instant stream copy for simple trimming.
- After: Processing time proportional to video length and CPU power.
- Impact: Increased server load, but high value for users.

### 📈 Value Proposition

**Benefits:**
- ✅ **Complete Workflow:** Users can go from long podcast to ready-to-post Reel entirely within AudioHighlights.
- ✅ **Retention:** Reduces churn to competing "all-in-one" AI clipping tools.
- ✅ **Mobile Friendly:** Ready-to-post videos can be downloaded directly on mobile devices.

**User stories:**
- As a creator, I want to download a video with subtitles already on it so that I can upload it directly to TikTok without extra editing steps.

### ⚖️ Trade-offs

**Pros:**
- ✅ High user value.
- ✅ Uses existing FFmpeg infrastructure.

**Cons:**
- ❌ **Processing Time:** Re-encoding is CPU-intensive and slow compared to stream copying.
- ❌ **Server Costs:** Higher CPU usage on the microservice.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side Canvas rendering | Zero server cost | Extremely slow, memory-intensive | Not chosen |
| Client-side FFmpeg.wasm | No server cost | Slow on mobile, limited memory | Not chosen |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 days)
- [ ] Implement `subtitles` filter route in `ffmpeg-service`.
- [ ] Add temporary file handling for the SRT on the server.

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Update frontend Export menu to include "Exportar com Legendas na Tela".
- [ ] Connect frontend to the new ffmpeg-service endpoint.

**Phase 3: Polish & Testing** (estimated: 1 days)
- [ ] Add progress indicators since re-encoding will take time.
- [ ] Test with different video aspect ratios and resolutions.

**Total estimated effort:** 4 developer-days

**Dependencies:**
- `ffmpeg-static` (already installed)

**Risks:**
- ⚠️ Server timeout during long renders - Mitigation: Process async and poll, or use WebSockets for progress.
- ⚠️ High CPU cost - Mitigation: Offer this feature only for shorter clips (e.g., < 2 mins) or premium users.

### 📚 Resources

**Documentation:**
- [FFmpeg Subtitles Filter Docs](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)
- [FFmpeg Re-encoding Guide](https://trac.ffmpeg.org/wiki/Encode/H.264)

### 🎬 Next Steps

**If approved:**
1. Create a branch to test the `subtitles` filter with our current `ffmpeg-static` build.
2. Draft the API endpoint in the service.

### 💬 Discussion Points
- Should we provide style customization (colors, fonts), or stick to a default Netflix-style yellow/white?
- How should we handle the potential timeout limits?
