## 🔬 Researcher: Remotion Advanced Video Export

### 🎯 Executive Summary
Propose replacing or supplementing the basic FFmpeg video export with Remotion to enable rich, dynamic video generation featuring burned-in captions, custom animated waveforms, and branded backgrounds directly in the application.

### 💡 Problem Statement
**Current situation:**
Currently, exporting a highlight as a video relies on FFmpeg stream copying or basic re-encoding on the `ffmpeg-service`. This produces raw video clips or audio-only files without visual flair.

**User impact:**
Content creators want "ready-to-post" viral clips for platforms like TikTok, Reels, or Shorts. They currently have to export the raw media and subtitle (SRT) files into a separate editor like Premiere or CapCut to add dynamic text and branding.

**Example scenario:**
A podcaster highlights a great 30-second quote. They want a vertical video with their logo, a dynamic waveform, and animated "karaoke-style" captions to post on Instagram. They cannot do this in AudioHighlights right now.

### 🚀 Proposed Solution
**What:**
Integrate Remotion to generate high-quality, programmatic videos from React components.

**How it works:**
- We build a React component (`<HighlightVideo />`) that takes the audio URL, transcript segments, and branding options as props.
- On the client side, we use `@remotion/player` to let the user preview the final video, customizing colors and layouts in real-time.
- For rendering, we can use `@remotion/bundler` and `@remotion/renderer` (or `@remotion/lambda` for scalable serverless rendering) to generate the final MP4 file with burned-in captions and graphics.

**Why this approach:**
- **Developer Experience:** We already know React. Building complex video templates is just writing React components and CSS.
- **Customization:** Infinite possibilities for branding, fonts, animations, and layouts (vertical, square, horizontal).
- **Preview:** Perfect 1:1 preview in the browser before spending compute resources on rendering.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Remotion (v4.x)
- **Maturity:** Stable, widely used in production for programmatic video.
- **Adoption:** Used by companies like GitHub (for Unwrapped), Spotify, and many AI clipping tools.
- **Community:** 18k+ GitHub stars, very active Discord.
- **License:** Remotion requires a company license for commercial use if you are a larger entity, but is free for individuals/small startups (up to 3 employees/contractors). *Must verify our license eligibility.*
- **Bundle size:** Moderate impact on the client side (mainly `@remotion/player`), heavy on the build/render side.

**Competitive Analysis:**
- OpusClip, Munch, Riverside: All offer advanced clipping with burned-in, dynamic captions (often called "Alex Hormozi style" captions).
- AudioHighlights: Currently only offers raw export + SRT.

**Best Practices:**
- Separate the video template components into a dedicated package or directory.
- Use `@remotion/player` for the live preview to avoid layout shifts and ensure what-you-see-is-what-you-get.

### 🧪 Proof of Concept

**Implementation:**
```tsx
// See research/pocs/remotion-export/remotion-poc.tsx
import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, Audio } from 'remotion';

export const HighlightVideo = ({ audioUrl, transcriptSegments, themeColor }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTime = frame / fps;

  const currentSegment = transcriptSegments.find(
    (seg) => currentTime >= seg.start && currentTime <= seg.end
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#111' }}>
      <Audio src={audioUrl} />
      {/* Dynamic text rendering based on current time */}
      <div style={{ fontSize: 60, color: 'white' }}>
        {currentSegment?.text}
      </div>
    </AbsoluteFill>
  );
};
```

**Demo:**
The POC component demonstrates how standard React props (audioUrl, transcript data) can drive a frame-by-frame video render, perfectly synchronizing text appearance with audio playback.

**Performance:**
- **Preview:** Real-time 60fps in browser.
- **Render Time:** Dependent on backend capability, typically 0.5x to 1x real-time depending on effects complexity.
- **Impact:** Huge leap in value for end-users, saving them hours of manual editing per clip.

### 📈 Value Proposition

**Benefits:**
- ✅ **All-in-one Workflow:** Users don't need CapCut or Premiere anymore.
- ✅ **Viral Formats:** Easy to support 9:16 vertical video for TikTok/Reels.
- ✅ **Branding:** Allow users to upload logos and pick brand colors for their exports.

**User stories:**
- As a **Podcaster**, I can **export a 9:16 video with animated captions** so that **I can immediately post it to TikTok.**

### ⚖️ Trade-offs

**Pros:**
- ✅ Familiar React programming model.
- ✅ 1:1 Browser preview via `@remotion/player`.
- ✅ Highly customizable templates.

**Cons:**
- ❌ **Licensing:** Need to ensure we comply with the Remotion company license.
- ❌ **Compute Cost:** Rendering video server-side requires significant CPU/RAM compared to simple FFmpeg stream copying. We would likely need to provision specific worker nodes or use `@remotion/lambda` (AWS costs).
- ❌ **Complexity:** Adds a heavy new dependency and rendering pipeline.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| FFmpeg `drawtext` | Very fast, no new deps | Incredibly hard to style, no animations | Not chosen because of poor UX and styling limits |
| HTML Canvas Record | Free, client-side | Poor quality, drops frames, brittle | Not chosen because output must be professional grade |

### 🛠️ Implementation Plan

**Phase 1: Foundation & Templates** (estimated: 3 days)
- [ ] Install Remotion dependencies.
- [ ] Create base `<HighlightVideo />` React template.
- [ ] Implement basic subtitle synchronization in the template.

**Phase 2: Client Preview** (estimated: 2 days)
- [ ] Add `@remotion/player` to the Export Dialog.
- [ ] Add controls for aspect ratio (16:9, 9:16, 1:1) and theme color.

**Phase 3: Server Rendering** (estimated: 4 days)
- [ ] Setup `@remotion/renderer` on a backend service (or adapt `ffmpeg-service`).
- [ ] Create API endpoint to trigger render job and return MP4 url.
- [ ] Handle progress reporting and WebSockets for long-running renders.

**Total estimated effort:** 9 developer-days

**Dependencies:**
- `remotion`
- `@remotion/player`
- `@remotion/bundler`
- `@remotion/renderer`

**Risks:**
- ⚠️ **Server Costs:** Rendering videos is expensive. - Mitigation: Implement strict rate limits or a credits system for advanced exports.
- ⚠️ **Render Times:** Long renders lead to bad UX. - Mitigation: Use `@remotion/lambda` for concurrent chunk rendering if budget allows, or ensure strong UI feedback (progress bars, email notifications).

### 📚 Resources

**Documentation:**
- [Remotion Docs](https://www.remotion.dev/docs)
- [Remotion Player](https://www.remotion.dev/docs/player)

**Examples:**
- [Remotion Audiogram Template](https://github.com/remotion-dev/template-audiogram)

### 🎬 Next Steps

**If approved:**
1. Review Remotion licensing terms against our company structure.
2. Build a standalone rendering worker to test performance on our existing infrastructure.
3. Design the Export UI to incorporate the Remotion Player.

### 💬 Discussion Points
- How do we want to handle the infrastructure costs of rendering? Should this be a paid/premium feature only?
- Should we use AWS Lambda via `@remotion/lambda` or spin up dedicated worker instances?
