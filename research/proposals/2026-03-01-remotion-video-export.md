## 🔬 Researcher: Advanced Video Export with Remotion

### 🎯 Executive Summary
This proposal evaluates upgrading our current server-side FFmpeg video rendering to a React-based client-side/serverless architecture using **Remotion**. By adopting Remotion, we can programmatically generate high-quality vertical videos (TikTok, Reels, Shorts) with complex, burned-in dynamic captions and custom backgrounds, directly leveraging our existing React expertise and improving the final export quality.

### 💡 Problem Statement
**Current situation:**
Currently, our video export pipeline relies on a microservice running FFmpeg (in the `ffmpeg-service` on Railway) which handles basic trimming (`atrim`) and concatenation (`concat`). Adding complex visual elements like dynamic, styled, word-by-word captions (Karaoke style) or dynamic background images/videos via FFmpeg is notoriously difficult, error-prone, and slow. The current setup is excellent for basic cuts but lacks the modern aesthetic required for viral social media clips.

**User impact:**
Users want ready-to-publish, visually engaging clips for platforms like TikTok and YouTube Shorts. Without built-in dynamic captions and attractive visual backgrounds, users must export the raw trimmed video and use third-party tools (like CapCut or Premiere) to finish their edit, adding friction to their workflow.

**Example scenario:**
A user generates a 45-second highlight from a 2-hour podcast. They want the exported video to be in a 9:16 aspect ratio, feature a custom uploaded background image (e.g., the podcast logo), and display the transcribed text as dynamic, animated captions perfectly synced with the audio. Currently, this is impossible within our application.

### 🚀 Proposed Solution
**What:**
Integrate [Remotion](https://www.remotion.dev/), a suite of libraries for creating videos programmatically using React.

**How it works:**
1.  We define our video templates as standard React components (see POC in `research/pocs/remotion-export/VideoExport.tsx`).
2.  We pass our existing highlight data (audio chunks, transcript segments with timestamps, user settings) as props to the Remotion composition.
3.  Remotion renders these React components frame-by-frame.
4.  For export, we can use `@remotion/lambda` for serverless rendering on AWS (highly scalable and fast), or `@remotion/bundler` to render via a dedicated Node.js worker (replacing or augmenting our current FFmpeg service).

**Why this approach:**
-   **React Ecosystem:** Our team already knows React. Building video templates becomes identical to building UI components.
-   **Dynamic Captions:** Syncing text to timestamps is straightforward using Remotion's `useVideoConfig` and sequence components.
-   **Quality:** We can leverage CSS for styling captions, shadows, animations, and transitions, achieving a "CapCut-like" quality that is very hard to replicate with pure FFmpeg.

### 📊 Research Findings

**Technology Analysis:**
-   **Library/Framework:** Remotion v4.x
-   **Maturity:** Stable (Used in production by major companies like GitHub, Spotify).
-   **Adoption:** Widely adopted for programmatic video generation.
-   **Community:** >20k GitHub stars, highly active Discord.
-   **License:** Remotion License (Free for individuals and small teams; paid for larger companies. Need to verify our company size tier).
-   **Bundle size:** N/A for client payload if rendered server-side; if rendered client-side (via WebCodecs, experimental), adds ~500kb. Serverless Lambda approach is recommended.

**Competitive Analysis:**
-   **Opus Clip / Munch / Vizard:** All offer high-quality, burned-in dynamic captions (often called "Alex Hormozi style") and B-roll/background insertion. This feature is table-stakes for modern AI clipping tools.
-   **Our App:** Currently exports basic trimmed video or raw audio + SRT.

**Best Practices:**
-   Separate video rendering infrastructure from the main web server (Lambda is ideal).
-   Pre-fetch and cache remote assets (audio/images) before rendering frames.
-   Use `remotion preview` for local development of templates.

### 🧪 Proof of Concept

**Implementation:**
A basic POC React component demonstrating how subtitles and backgrounds are layered is available in `research/pocs/remotion-export/VideoExport.tsx`.

```tsx
// Snippet from POC
<Sequence from={startFrame} durationInFrames={durationFrames}>
  <div style={captionStyle}>{subtitle.text}</div>
</Sequence>
```

**Demo:**
The POC component successfully structures a 9:16 video composition with background image, audio track, and text sequences mapped to timestamps.

**Performance:**
-   **Before:** FFmpeg trimming takes ~2-5 seconds per clip. Captions must be applied by the user in a separate app.
-   **After:** Remotion rendering on Lambda typically takes 10-30 seconds for a 60-second clip, but delivers a fully finished, ready-to-post asset.
-   **Impact:** Significant UX improvement (finished asset) at the cost of slightly longer processing time and new infrastructure setup.

### 📈 Value Proposition

**Benefits:**
-   ✅ **Higher Value Output:** Users get a final product ready for TikTok/Reels without needing CapCut.
-   ✅ **Developer Velocity:** Writing video templates in React is dramatically faster than writing complex FFmpeg filtergraphs.
-   ✅ **Customizability:** Easy to add new templates, fonts, and brand colors in the future.

**User stories:**
-   As a content creator, I can export a vertical video with burned-in animated captions so that I can immediately post it to TikTok without further editing.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Developer experience (React/CSS vs FFmpeg filters).
-   ✅ Vastly superior visual quality for text and animations.
-   ✅ Ecosystem of pre-built components and effects.

**Cons:**
-   ❌ **Cost & Infrastructure:** Requires setting up AWS Lambda for scalable rendering (`@remotion/lambda`) or a dedicated rendering server.
-   ❌ **Licensing:** Need to ensure compliance with Remotion's licensing model based on company revenue/size.
-   ❌ Increased export time compared to simple `atrim` stream copying.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Complex FFmpeg Filters (`drawtext`)** | Free, uses existing infra. | Extremely difficult to style, animate, or debug. Painful developer experience. | Not chosen because the visual quality required for modern social media is too hard to achieve. |
| **Client-side HTML5 Canvas recording** | Free, no server cost. | Unreliable on mobile, quality varies, blocks main thread, slow for high-resolution. | Not chosen due to poor UX and reliability. |

### 🛠️ Implementation Plan

**Phase 1: Foundation & Templates** (estimated: 4 days)
-   [ ] Verify Remotion licensing tier.
-   [ ] Install Remotion locally and setup the preview environment.
-   [ ] Port the POC into a robust template (e.g., `SocialMediaClip` template) handling word-level highlighting.

**Phase 2: Infrastructure Setup** (estimated: 3 days)
-   [ ] Set up AWS Lambda environment for `@remotion/lambda`.
-   [ ] Create an API route in Next.js to trigger the Lambda render job.
-   [ ] Implement polling or webhooks to track render progress.

**Phase 3: UI Integration** (estimated: 3 days)
-   [ ] Update the export dialog to include "Render Video with Captions" option.
-   [ ] Build UI for selecting templates, background images, and fonts.
-   [ ] Integrate progress bar for rendering status.

**Total estimated effort:** 10 developer-days

**Dependencies:**
-   `remotion`
-   `@remotion/lambda` (or `@remotion/bundler` for self-hosted)

**Risks:**
-   ⚠️ **AWS Costs:** Lambda rendering costs money.
    -   *Mitigation:* Start with a self-hosted Node.js worker on our existing Railway setup before scaling to Lambda, or pass the cost to premium users.
-   ⚠️ **Asset Loading Timeouts:** Rendering fails if remote audio/images are too slow to load.
    -   *Mitigation:* Ensure all assets (audio chunks, background images) are fully uploaded to an S3-compatible storage before triggering the render.

### 📚 Resources

**Documentation:**
-   [Remotion Documentation](https://www.remotion.dev/docs)
-   [Remotion Lambda Guide](https://www.remotion.dev/docs/lambda)

**Examples:**
-   [Remotion GitHub Repository](https://github.com/remotion-dev/remotion)

### 🎬 Next Steps

**If approved:**
1.  Confirm licensing requirements.
2.  Set up a local Remotion studio environment to test template designs.
3.  Decide between AWS Lambda or self-hosted rendering architecture.

**Questions to resolve:**
-   [ ] Do we qualify for the free company license, or do we need to budget for a paid license?
-   [ ] Should video rendering be restricted to Pro users due to infrastructure costs?

### 💬 Discussion Points
-   How important is word-by-word animation vs phrase-by-phrase? (Word-by-word requires better transcription accuracy, which Whisper provides, but makes the template more complex).
-   Should we allow users to upload custom fonts?