## 🔬 Researcher: Vertical Video Export for Social Media (Shorts/Reels/TikTok)

### 🎯 Executive Summary
Enable users to automatically export their podcast highlights as 9:16 vertical videos with hardcoded, styled subtitles ("karaoke style"). This adds immense value by directly supporting the most common use case for podcast clips: publishing to platforms like TikTok, Instagram Reels, and YouTube Shorts without requiring external editing software.

### 💡 Problem Statement
**Current situation:**
Currently, users can generate highlights and cut video clips in the original aspect ratio (usually 16:9). They can also download an SRT file for subtitles. However, to post these clips to social media (Shorts/Reels/TikTok), they must use an external video editor (like Premiere, CapCut, or DaVinci Resolve) to manually crop the video to 9:16 and burn in the subtitles.

**User impact:**
Every user looking to promote their content on modern social platforms faces a significant friction point. The core value of "AudioHighlights" is rapid clip generation, but the current pipeline stops short of producing ready-to-publish assets for the most popular formats.

**Example scenario:**
A user generates a 45-second viral highlight. They download the MP4 and SRT. They then have to open CapCut, import both, adjust the crop to fit the speaker, style the text, and render again before finally posting to TikTok.

### 🚀 Proposed Solution
**What:**
Add an "Export to Social (9:16)" option in the highlight card. This will use the server-side FFmpeg microservice (or client-side WASM as fallback) to process the cut video clip: cropping it to 9:16, scaling it appropriately, and hardcoding the VTT/SRT subtitles directly onto the video using a modern, bold style.

**How it works:**
1. Send the original video, the start/end timestamps, and the generated SRT text to the FFmpeg backend.
2. Use FFmpeg's `crop` and `scale` filters to convert the aspect ratio to 9:16 (e.g., center crop: `crop=ih*(9/16):ih,scale=1080:1920`).
3. Use FFmpeg's `subtitles` filter with `force_style` to burn the subtitles with a specific font, size, and background/outline to make them readable (e.g., `force_style='FontSize=24,Alignment=2,MarginV=50'`).
4. Return the processed MP4 to the user.

**Why this approach:**
- **Zero extra dependencies:** We already use FFmpeg (client and server) and have the SRT generation logic. It leverages our existing infrastructure.
- **High ROI:** Massive workflow improvement for users with minimal backend changes.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** FFmpeg (fluent-ffmpeg on server, @ffmpeg/ffmpeg on client)
- **Maturity:** Highly stable
- **Community:** Industry standard for video processing
- **Bundle size:** No new client dependencies

**Competitive Analysis:**
- OpusClip / Riverside / Veed.io: All of these competitor products center their entire value proposition around generating these vertical, subtitled clips. Adding this feature closes a massive competitive gap.

**Best Practices:**
- Center-cropping is the safest default for 16:9 podcasts (assumes speaker is in the middle).
- Subtitles should be placed in the lower third (but not too low, to avoid platform UI overlays like TikTok's description box).
- Yellow or white text with a black outline/background box offers the best contrast.

### 🧪 Proof of Concept

**Implementation (FFmpeg Command Example):**
```bash
# How the backend would process it
ffmpeg -i input.mp4 -vf "crop=ih*(9/16):ih,scale=1080:1920,subtitles=subs.srt:force_style='FontName=Arial,FontSize=24,PrimaryColour=&H00FFFF,OutlineColour=&H000000,BorderStyle=1,Outline=2,Alignment=2,MarginV=80'" -c:a copy output_vertical.mp4
```

*Note: Since the FFmpeg WASM build may have limitations with the `subtitles` filter depending on how it was compiled (often requires libass), this feature should primarily target the server-side FFmpeg service.*

### 📈 Value Proposition

**Benefits:**
- ✅ **Massive Time Savings:** Eliminates the need for third-party editors like CapCut.
- ✅ **Ready-to-Publish:** Users get a file they can instantly upload to TikTok/Reels.
- ✅ **Competitive Parity:** Brings the tool closer to dedicated AI clipping tools.

**User stories:**
- As a podcast creator, I can export my viral highlight as a 9:16 vertical video with baked-in subtitles so that I can immediately post it to Instagram Reels without opening a video editor.

### ⚖️ Trade-offs

**Pros:**
- ✅ High user value.
- ✅ Uses existing stack.

**Cons:**
- ❌ Hardcoded center crop might cut off multiple speakers if they are side-by-side (requires more advanced face-tracking to solve perfectly).
- ❌ Burning subtitles is CPU intensive, increasing server load.
- ❌ Client-side WASM FFmpeg might struggle or lack libass support for the `subtitles` filter, making this heavily reliant on the server.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side Canvas rendering | Fast, no server cost | Highly complex, requires rebuilding a video editor in React | Not chosen due to complexity. |
| AI Face Tracking Crop | Perfect framing | Requires heavy ML models | Not chosen (v2 improvement, start simple with center crop). |

### 🛠️ Implementation Plan

**Phase 1: Foundation (Backend)** (estimated: 1 day)
- [ ] Update the `ffmpeg-service` (express server) to accept an optional `srt` string or file, and a `format` parameter (e.g., `vertical`).
- [ ] Add the `crop`, `scale`, and `subtitles` filter logic to the fluent-ffmpeg pipeline in the backend service.

**Phase 2: Core Feature (Frontend)** (estimated: 1 day)
- [ ] Update `use-ffmpeg.ts` to pass the generated SRT and format flag when calling the server.
- [ ] Add an "Export Vertical (Social)" button to the `highlight-card.tsx` component.

**Total estimated effort:** 2 developer-days

**Dependencies:**
- Server must have FFmpeg compiled with `--enable-libass` (standard in most linux distributions and ffmpeg-static).

**Risks:**
- ⚠️ **Server Load:** Burning subtitles requires transcoding video (`libx264`), which is much slower than `stream copy` (`-c copy`).
  - *Mitigation:* Limit feature to short clips (< 2 mins) and ensure the server has adequate CPU or use hardware acceleration (`-c:v h264_nvenc`) if available.
- ⚠️ **WASM Limitation:** The client-side FFmpeg fallback will likely fail.
  - *Mitigation:* Disable the vertical export button if `NEXT_PUBLIC_FFMPEG_SERVICE_URL` is not set.

### 🎬 Next Steps

**If approved:**
1. Test standard FFmpeg container with libass support locally.
2. Implement backend route in `ffmpeg-service`.
3. Add UI button and test end-to-end.

### 💬 Discussion Points
- Should we offer customization for the subtitle font/color, or stick to one optimized style for now?
- How do we handle side-by-side podcasts? Should we offer a "Split screen" layout option alongside "Center crop"?

### 📚 Resources

**Documentation:**
- [FFmpeg Filtering Guide](https://ffmpeg.org/ffmpeg-filters.html)
- [fluent-ffmpeg Documentation](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg#readme)

**Examples:**
- [Hardcoding subtitles with FFmpeg (StackOverflow)](https://stackoverflow.com/questions/8672809/use-ffmpeg-to-add-text-subtitles)

**Community:**
- [FFmpeg Trac/Wiki on Subtitles](https://trac.ffmpeg.org/wiki/HowToBurnSubtitlesIntoVideo)
