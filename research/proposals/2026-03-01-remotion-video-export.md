## 🔬 Researcher: Remotion for Advanced Video Exporting

### 🎯 Executive Summary
Implementing Remotion to replace basic FFmpeg video exporting, enabling high-quality, programmatic video generation with dynamic burned-in captions, custom backgrounds, and rich animations directly in the browser and on the server. This will significantly elevate the production value of exported highlights.

### 💡 Problem Statement
**Current situation:**
Currently, video exporting relies on basic server-side FFmpeg processing. This limits the visual quality of the output, making it difficult or impossible to add dynamic styling, animations, complex text overlays (like burned-in captions with animations), or custom branding elements without complex FFmpeg filter commands.

**User impact:**
Users creating viral clips for social media (TikTok, Instagram Reels, YouTube Shorts) need high production value. Basic static text or simple subtitles are often not engaging enough. Users currently have to download the exported video and use third-party tools (like CapCut or Premiere) to add these dynamic elements.

**Example scenario:**
A user generates a great 30-second highlight from their podcast. They want to export it for TikTok with "karaoke-style" captions (where words light up as they are spoken) and a dynamic background with their logo. Currently, they can only get a basic video and an SRT file, requiring another software to achieve their final goal.

### 🚀 Proposed Solution
**What:**
Integrate Remotion (`remotion`) into the AudioHighlights export pipeline to generate video compositions programmatically using React.

**How it works:**
1.  **Composition:** Create a React component (`HighlightVideo`) using Remotion's APIs (`Sequence`, `AbsoluteFill`, `useCurrentFrame`) that takes the audio highlight, transcription data, and user preferences (colors, background) as props.
2.  **Rendering:** Use `@remotion/bundler` and `@remotion/renderer` on the server (or potentially client-side via WebCodecs in the future, though server-side rendering is more robust initially) to bundle and render the React composition into an MP4 file.
3.  **Dynamic Captions:** Sync the transcription word timings with the Remotion frame count to animate text exactly as it's spoken.

**Why this approach:**
Remotion allows us to use our existing React and CSS knowledge to build complex video templates. It bridges the gap between web development and video editing, offering unparalleled flexibility compared to raw FFmpeg scripts, while still leveraging FFmpeg under the hood for the final encoding.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `remotion` (v4.0+)
- **Maturity:** Stable, battle-tested in production by many companies.
- **Adoption:** Used by GitHub (Unwrapped), Spotify, and many video-generation startups.
- **Community:** >20k GitHub stars, highly active community and excellent documentation.
- **License:** Remotion requires a license for commercial use by companies exceeding a certain size/revenue, but is free for open-source and many indie projects. We need to verify our specific license status.
- **Bundle size:** Significant server-side footprint, requires a specific Node.js environment with headless browser support (Puppeteer/Chromium) for rendering.

**Competitive Analysis:**
Many modern AI clipping tools (OpusClip, Munch, Vizard) offer highly stylized, animated captions out-of-the-box.
- **Competitor A (OpusClip):** Offers various dynamic caption styles and layouts.
- **Competitor B (Descript):** Provides timeline-based video editing with rich text overlays.
- **Our App:** Currently limited to basic rendering or exporting SRTs for external tools.

**Best Practices:**
- Define exact frame rates and dimensions upfront.
- Use `useVideoConfig` and `useCurrentFrame` carefully to ensure deterministic rendering.
- Keep components pure; do not rely on external asynchronous data fetching during the render phase (fetch data beforehand and pass as props).

### 🧪 Proof of Concept

**Implementation:**
A basic POC has been created demonstrating a Remotion composition that displays dynamic text synchronized with frames and a custom styled background.

```tsx
// Link to POC: research/pocs/remotion-export/index.tsx
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import React from "react";

// (Simplified view of the POC)
export const HighlightVideo: React.FC = () => {
  const frame = useCurrentFrame();
  // ... synchronization logic ...
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a1a" }}>
      {/* Dynamic Background */}
      {/* Animated Text Layer synchronized to `frame` */}
    </AbsoluteFill>
  );
};
```

**Demo:**
The POC renders a responsive, animated React component that represents the final video layout.

**Performance:**
- Rendering time will be longer than simple FFmpeg stream copying, as it requires headless browser rendering.
- Quality and flexibility are massively improved.

### 📈 Value Proposition

**Benefits:**
- ✅ **Professional Quality:** Enables "viral-style" videos directly from the app.
- ✅ **Customization:** Users can choose branding, colors, and caption styles.
- ✅ **Developer Experience:** We can build video templates using standard React components instead of complex FFmpeg strings.

**User stories:**
- As a content creator, I can export a highlight with animated captions so that I can immediately post it to TikTok without using another editor.

### ⚖️ Trade-offs

**Pros:**
- ✅ Endless visual possibilities (animations, SVGs, custom fonts).
- ✅ Reuses existing React/CSS skills.

**Cons:**
- ❌ **Server-side Complexity:** Requires managing Headless Chrome/Puppeteer for rendering.
- ❌ **Rendering Time:** Considerably slower than basic FFmpeg trimming.
- ❌ **Licensing:** Requires careful review of Remotion's commercial license terms.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Advanced FFmpeg Filters | No new dependencies, fast | Extremely complex syntax, very hard to maintain and style | Not chosen because it scales poorly for complex UI requirements. |
| WebCodecs API | Client-side, no server cost | Very low-level, hard to build complex layouts, experimental | Not chosen because it lacks the layout engine (CSS/DOM) needed for easy template creation. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 3 days)
- [ ] Review Remotion licensing requirements.
- [ ] Set up Remotion in a separate service or serverless function capable of running Puppeteer.
- [ ] Create base Remotion React components matching the existing POC.

**Phase 2: Core Feature** (estimated: 4 days)
- [ ] Map actual transcription JSON data to Remotion components.
- [ ] Implement audio synchronization within the Remotion player.
- [ ] Build a basic settings UI for users to select video styles.

**Phase 3: Polish & Testing** (estimated: 3 days)
- [ ] Optimize rendering times.
- [ ] Add loading states and progress bars for the user during rendering.
- [ ] End-to-end testing of the export flow.

**Total estimated effort:** 10 developer-days

**Dependencies:**
- `remotion`
- `@remotion/bundler`
- `@remotion/renderer`

**Risks:**
- ⚠️ **Server Resource Usage:** Rendering videos with Puppeteer is CPU/RAM intensive. - Mitigation: Implement queuing and potentially offload to a dedicated worker service.
- ⚠️ **Rendering Speed:** Users might find the export too slow. - Mitigation: Provide clear progress indicators and offer email notifications upon completion.

### 📚 Resources

**Documentation:**
- [Remotion Official Docs](https://www.remotion.dev/docs/)

**Examples:**
- [Remotion GitHub Repository](https://github.com/remotion-dev/remotion)

### 🎬 Next Steps

**If approved:**
1.  Verify Remotion commercial licensing terms for our specific use case.
2.  Begin architecture design for the rendering queue system.
3.  Develop the first official video template using React.

### 💬 Discussion Points
- Should we offer rendering purely server-side, or explore `@remotion/player` for client-side preview before rendering?
- How should we handle the compute costs associated with server-side video rendering?
