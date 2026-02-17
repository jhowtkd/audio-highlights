## 🔬 Researcher: Client-Side Audiogram Generator (FFmpeg WASM)

### 🎯 Executive Summary
Implement a browser-based "Audiogram" generator that converts audio highlights into shareable MP4 videos with waveform visualizations and custom backgrounds. This feature unlocks viral growth loops by allowing users to share their content directly to video-first platforms like TikTok, Instagram Reels, and YouTube Shorts, without server-side processing costs.

### 💡 Problem Statement
**Current situation:**
The application generates text transcripts and audio clips. However, social media platforms (TikTok, Instagram, YouTube Shorts) prioritize **video** content. Users currently have to download the audio and use third-party tools (like Headliner or Canva) to create a video, adding friction and leading to drop-off.

**User impact:**
- **Friction:** High effort to share content.
- **Missed Growth:** Users share less often because it's hard.
- **Brand Consistency:** Third-party tools impose their own watermarks or styles.

**Example scenario:**
A podcaster finds a perfect 45-second highlight using our tool. They want to post it to Instagram Stories. Currently, they can only download the `.mp3`. Instagram Stories requires a video or an image with sticker. They give up or just post a static link that gets no engagement.

### 🚀 Proposed Solution
**What:**
Add an "Export to Video" (Audiogram) feature in the Highlights tab.

**How it works:**
1.  **Input:** User selects a Highlight + Background Image (or solid color) + Waveform Style.
2.  **Processing:** Use the existing `@ffmpeg/ffmpeg` (WASM) instance to combine the audio and image.
3.  **Visualization:** Use FFmpeg's `showwaves` or `avectorscope` filters to render a dynamic waveform overlay.
4.  **Output:** Generate an `.mp4` file (H.264/AAC) ready for download.

**Why this approach:**
- **Zero Server Cost:** Processing happens on the user's device via WebAssembly.
- **Privacy:** Audio/Images never leave the browser.
- **Leverage Existing Stack:** We already use `@ffmpeg/ffmpeg` for cutting.

### 📊 Research Findings

**Technology Analysis:**
- **Library:** `@ffmpeg/ffmpeg` (already in `package.json`)
- **Capability:** Supports complex filter graphs including `showwaves`, `overlay`, `drawtext` (with font loading).
- **Performance:** Rendering a 60s SD video takes ~30-60s on modern laptops (acceptable for this use case).
- **Format:** Can output standard MP4 (libx264) which is universally compatible.

**Competitive Analysis:**
- **Descript:** Has built-in audiogram generator (Server/Cloud based).
- **Headliner:** Dedicated tool, freemium model with watermarks.
- **Spotify/Anchor:** Auto-generates basic videos.
- **Our Advantage:** Free, unlimited, no watermark, integrated into the transcription workflow.

**Best Practices:**
- Use `ultrafast` preset for WASM encoding to minimize wait time.
- Use 1080x1920 (9:16) aspect ratio default for mobile.
- Provide simple "Templates" rather than infinite customization to reduce decision fatigue.

### 🧪 Proof of Concept

**Validated FFmpeg Command (Node.js Proxy):**
The following filter graph was validated using `ffmpeg-static` to prove feasibility of waveform generation:

```bash
ffmpeg -f lavfi -i "sine=frequency=440:duration=5" \
  -filter_complex "[0:a]showwaves=s=1280x720:mode=line:colors=white[v]" \
  -map "[v]" -map 0:a \
  -c:v libx264 -preset ultrafast -c:a aac \
  output.mp4
```

**Proposed Client-Side Implementation:**
```typescript
const generateAudiogram = async (audioFile: File, bgImage: File): Promise<Blob> => {
  await ffmpeg.writeFile('audio.mp3', await fetchFile(audioFile));
  await ffmpeg.writeFile('bg.jpg', await fetchFile(bgImage));

  await ffmpeg.exec([
    '-i', 'audio.mp3',
    '-i', 'bg.jpg',
    '-filter_complex',
    '[0:a]showwaves=s=1080x1920:mode=line:colors=white:rate=25[waves];[1:v][waves]overlay=(W-w)/2:(H-h)/2[outv]',
    '-map', '[outv]',
    '-map', '0:a',
    '-c:v', 'libx264', '-preset', 'ultrafast',
    '-c:a', 'aac',
    '-shortest',
    'output.mp4'
  ]);

  const data = await ffmpeg.readFile('output.mp4');
  return new Blob([data.buffer], { type: 'video/mp4' });
}
```

### 📈 Value Proposition

**Benefits:**
- ✅ **Viral Growth:** content is formatted for the most viral platforms.
- ✅ **User Stickiness:** Transforms the tool from "just transcription" to "content creation suite".
- ✅ **Cost Efficiency:** No GPU servers required for video rendering.

**User stories:**
- As a **Social Media Manager**, I can grab a 30s soundbite and turn it into a Reel in 1 minute.
- As a **Podcaster**, I can tease my new episode with a visual preview without learning video editing.

### ⚖️ Trade-offs

**Pros:**
- ✅ High user value.
- ✅ Low marginal cost (client-side).
- ✅ Privacy-first.

**Cons:**
- ❌ **Performance:** Slower than native/server rendering. Might struggle on low-end mobile devices.
- ❌ **Browser Support:** Requires `SharedArrayBuffer` support (cross-origin isolation) for best performance, though single-threaded WASM works with limitations.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Server-Side (FFmpeg)** | Fast, consistent | Expensive (CPU/GPU costs), upload bandwidth | Not chosen (Cost) |
| **Canvas Recording** | Fast preview, realtime | Hard to export high-quality MP4, audio sync issues | Not chosen (Quality) |
| **Remotion** | React-based video | Adds large dependency, complex setup | Not chosen (Complexity) |

### 🛠️ Implementation Plan

**Phase 1: Core Generator (estimated: 2 days)**
- [ ] Extend `useFFmpeg` hook with `generateAudiogram`.
- [ ] Create `AudiogramModal` component.
- [ ] Implement basic waveform + solid color background.

**Phase 2: Customization (estimated: 2 days)**
- [ ] Add image upload for background.
- [ ] Add basic styling controls (waveform color, opacity).
- [ ] Add aspect ratio selection (9:16, 1:1, 16:9).

**Phase 3: Polish (estimated: 1 day)**
- [ ] Add progress bar for rendering.
- [ ] Add "Download" and "Share" buttons.

**Total estimated effort:** 5 developer-days

**Dependencies:**
- `@ffmpeg/ffmpeg` (Existing)
- `@ffmpeg/util` (Existing)

**Risks:**
- ⚠️ **Memory Limits:** WASM has memory limits (2GB usually). Large videos might crash.
    - *Mitigation:* Limit output resolution (1080p max) and duration (60s max initially).

### 📚 Resources

**Documentation:**
- [FFmpeg Filters Documentation](https://ffmpeg.org/ffmpeg-filters.html#showwaves)
- [FFmpeg WASM Guide](https://ffmpegwasm.netlify.app/)

### 🎬 Next Steps

**If approved:**
1.  Prototype the `generateAudiogram` function in `use-ffmpeg.ts`.
2.  Add a "Video" button to the Highlight Card.

**Questions to resolve:**
- [ ] Should we bundle a default font for captions later? (Increases bundle size).
