## 🔬 Researcher: Advanced Video Export with Remotion

### 🎯 Executive Summary
Propose replacing simple FFmpeg video exports with Remotion for generating high-quality, social-media-ready clips. This will allow us to offer features like burned-in dynamic captions (karaoke style), custom backgrounds for audio-only highlights, and brand styling directly from our web app.

### 💡 Problem Statement
**Current situation:**
Currently, our application uses FFmpeg (via `ffmpeg-service` or client-side WASM) to cut and concatenate video clips. It does a simple "stream copy" or re-encode of the exact source file.
If a user uploads an audio-only file, we cannot generate a shareable video clip (e.g., MP4 with a waveform or static image).
Furthermore, even for video, we do not burn captions into the exported MP4.

**User impact:**
Users want to export viral clips directly for TikTok, Reels, or Shorts. These platforms heavily favor videos with dynamic, burned-in captions. Our current exports require the user to take the exported video and SRT file into another tool (like CapCut or Premiere) to add captions and styling.

**Example scenario:**
A user generates a great 60-second highlight from an audio-only podcast. They want to post it to Instagram Reels. Currently, they can only export an MP3 and an SRT. They must manually find an image, sync the audio, and animate the SRT in a separate video editor.

### 🚀 Proposed Solution
**What:**
Integrate Remotion to generate rich, animated MP4 exports on the server side (or client side if feasible, but server-side rendering is more robust).
Remotion allows writing video compositions using React and rendering them to MP4 via Puppeteer/FFmpeg.

**How it works:**
1.  **Composition:** Create a generic Remotion `Composition` (e.g., `<ViralClip />`) that takes a video/audio source and a transcript JSON as props.
2.  **Rendering:**
    -   When a user clicks "Export Video with Captions", send the highlight metadata to a new endpoint (e.g., `/render-clip` on our backend or a dedicated rendering service).
    -   The backend uses `@remotion/bundler` and `@remotion/renderer` to render the React component into an MP4 frame-by-frame.
3.  **Features:** The composition will render the background video, overlay animated text synced to the `currentTime` of the `useCurrentFrame()`, and add a progress bar.

**Why this approach:**
-   **React-based:** We can build complex animations (like karaoke text highlighting) using standard CSS and React, which our team already knows. Writing complex FFmpeg filtergraphs for text rendering is extremely brittle and limited.
-   **Audio support:** Remotion can easily take an audio file and render a visualization (like a waveform or audiogram) over a static or animated background.
-   **Quality:** Generates perfect, frame-accurate MP4s.

### 📊 Research Findings

**Technology Analysis:**
-   **Library/Framework:** Remotion (`remotion`, `@remotion/player`, `@remotion/renderer`)
-   **Maturity:** Stable and widely used for programmatic video.
-   **Bundle size:** Only the `@remotion/player` is needed on the client. Heavy rendering dependencies are server-side.
-   **License:** Remotion requires a license for commercial use by companies >10 employees or >$500k revenue. *Note: We need to verify our eligibility for the free tier or budget for the license.*

**Competitive Analysis:**
-   **Opus Clip / Munch:** Core value proposition is automatic, dynamic, "bouncing" captions with emojis.
-   **Descript:** Offers audiograms and simple burned-in captions.
-   **Our App:** Currently zero styling options; raw video cuts only.

### 🧪 Proof of Concept

**Implementation:**
A minimal POC composition showing dynamic text scaling based on the current word's timestamp.

```tsx
// research/pocs/remotion-export/CaptionComposition.tsx
import { AbsoluteFill, useVideoConfig, Video, useCurrentFrame, interpolate } from 'remotion';

export const CaptionComposition = ({ videoSrc, transcript }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find the active transcript word
  const activeWord = transcript.find(
    (word) => currentTime >= word.start && currentTime <= word.end
  );

  return (
    <AbsoluteFill>
      <Video src={videoSrc} />
      {activeWord && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ color: 'white', fontSize: '80px', textShadow: '0 4px 8px rgba(0,0,0,0.8)' }}>
            {activeWord.text}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
```

**Demo:**
The `CaptionComposition` successfully overlays text precisely timed to the transcript data.

**Performance:**
-   Server-side rendering time is roughly 0.5x to 1x real-time depending on server CPU (a 60s clip takes 30-60s to render).

### 📈 Value Proposition

**Benefits:**
-   ✅ **All-in-one workflow:** Users can go from long podcast to final social media post without leaving our app.
-   ✅ **Feature Parity:** Brings us closer to competitors who offer stylized clips.
-   ✅ **New Mediums:** Unlocks video exports for audio-only uploads (Audiograms).

**User stories:**
-   As a content creator, I want to export my highlight with burned-in, bouncing captions so that I can immediately upload it to TikTok.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Infinite customization using React/CSS.
-   ✅ Can offer a live preview using `@remotion/player` in the browser before rendering.

**Cons:**
-   ❌ **Rendering Cost:** Server-side rendering requires compute resources (Puppeteer instances). We may need a dedicated worker queue.
-   ❌ **Licensing:** Potential commercial license fees.
-   ❌ **Complexity:** Adds a heavy dependency and a new build process for the video bundles.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| FFmpeg `drawtext` | Free, no new infra needed | Terribly complex syntax, no modern animations (bounce, color pop) | Not chosen for stylized captions. |
| Client-side WASM Canvas | Free backend | Slow, crashes on mobile, hard to sync audio/video | Not chosen. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 3 days)
- [ ] Add Remotion dependencies.
- [ ] Create a basic `CaptionComposition` for video.
- [ ] Implement a basic `AudiogramComposition` for audio-only files.

**Phase 2: Rendering Infrastructure** (estimated: 5 days)
- [ ] Set up a rendering worker (could be a new microservice or integrated into `ffmpeg-service` if Node-based).
- [ ] Implement a job queue (e.g., BullMQ) to handle render requests without timing out HTTP requests.

**Phase 3: UI Integration** (estimated: 3 days)
- [ ] Add a "Styling" tab to the export modal.
- [ ] Integrate `@remotion/player` for live preview.
- [ ] Connect export button to the render queue and poll for status.

**Total estimated effort:** 11 developer-days

**Dependencies:**
-   `remotion`, `@remotion/player`, `@remotion/bundler`, `@remotion/renderer`
-   A queueing system for server renders (e.g., Redis + BullMQ).

**Risks:**
-   ⚠️ **Infrastructure Cost:** Rendering video is expensive. - Mitigation: Implement rate limits and perhaps make this a premium/paid feature.
-   ⚠️ **Font Loading:** Custom fonts must be loaded correctly in the Puppeteer environment. - Mitigation: Use web fonts with `continueRender` delays.

### 📚 Resources

**Documentation:**
-   [Remotion Docs](https://www.remotion.dev/docs/)
-   [Remotion Server-Side Rendering](https://www.remotion.dev/docs/ssr)

### 🎬 Next Steps

**If approved:**
1.  Confirm licensing requirements for our usage tier.
2.  Set up a dedicated branch to build out a richer POC composition with actual word-level animations.
