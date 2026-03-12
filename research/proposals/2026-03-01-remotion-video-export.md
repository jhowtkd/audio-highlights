## 🔬 Researcher: Dynamic Video Export with Burned-in Captions using Remotion

### 🎯 Executive Summary
This proposal suggests migrating our advanced video export features from raw FFmpeg to Remotion. By adopting Remotion, we can use React to programmatically generate dynamic videos with high-quality burned-in captions, custom backgrounds, and advanced visual styling, significantly enhancing our output for viral clips.

### 💡 Problem Statement
**Current situation:**
Currently, our video generation relies on raw FFmpeg running as a Docker microservice or via WebAssembly in the browser (`@ffmpeg/ffmpeg`). While FFmpeg is fast for basic stream copying and simple trims, adding dynamic, stylized elements like "karaoke-style" burned-in captions or complex React-based overlays requires error-prone, hard-to-maintain, and complex FFmpeg filter commands.

**User impact:**
Users want visually engaging clips optimized for social media (TikTok, Reels, Shorts) that require styled, animated captions and custom branding. Right now, providing this level of polish programmatically is extremely difficult.

**Example scenario:**
A user generates a 60-second highlight of a podcast and wants to export it with large, animated, word-by-word highlighted captions, custom borders, and a blurred background. Achieving this with raw FFmpeg would involve generating temporary subtitle files, complex filter graphs (`-filter_complex`), and maintaining non-React video layout code.

### 🚀 Proposed Solution
**What:**
Integrate Remotion to handle the video rendering and export process for highly stylized highlights. We will use Remotion to compose our videos in React, allowing us to build the video scenes using familiar HTML/CSS/React components, and then render the final MP4 server-side (or via browser API).

**How it works:**
1. We define a Remotion `<Composition>` that takes props (e.g., video URL, transcription segments, theme colors).
2. Inside the composition, we use Remotion's `<Video>`, `<Audio>`, and `<Sequence>` components.
3. We map over the transcription segments and wrap each in a `<Sequence>` that starts and ends based on the segment timestamps, displaying the text with React/CSS animations.
4. When a user exports a highlight, we trigger `@remotion/lambda` or a server-side Node.js Remotion render to build the video natively and return the MP4 URL.

**Why this approach:**
Remotion bridges the gap between web development and video production. Since our team is already proficient in React and Next.js, we can build complex video templates quickly. It moves the complexity of video rendering from obscure FFmpeg CLI commands to standard React component logic.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Remotion (v4.x)
- **Maturity:** Stable
- **Adoption:** Used heavily by companies building programmatic video apps (e.g., GitHub Unwrapped, Spotify Wrapped-style features).
- **Community:** 18k+ GitHub stars, very active ecosystem, dedicated Discord.
- **License:** Remotion has a company license model (free for individuals/open-source, requires a paid license for commercial use by larger companies; we need to review the specific licensing tiers for our business).
- **Bundle size:** Moderate impact on the server/build side; client-side impact is minimal if rendering happens server-side via `@remotion/lambda` or `@remotion/bundler`.

**Competitive Analysis:**
- Competitors like OpusClip and Riverside use advanced rendering engines to burn highly stylized, animated captions directly into exported videos. Raw FFmpeg struggles to match this visual quality without intermediate step generation (like rendering HTML to images frame-by-frame).

**Best Practices:**
- Use Server-Side Rendering (SSR) via `@remotion/lambda` for scalable, concurrent rendering rather than blocking a single Next.js API route.
- Keep video logic decoupled from the main UI; use generic props to pass state to Remotion components.

### 🧪 Proof of Concept

**Implementation:**
The POC code creates a `VideoExport` component that layers dynamic, timestamped text over a video.

```tsx
import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, Audio, Video } from 'remotion';

// Interfaces for our POC structure
interface TranscriptSegment {
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
}

interface VideoExportProps {
  videoUrl: string;
  segments: TranscriptSegment[];
  backgroundColor?: string;
}

export const VideoExport: React.FC<VideoExportProps> = ({ videoUrl, segments, backgroundColor = '#1a1a1a' }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <AbsoluteFill>
        <Video src={videoUrl} style={{ objectFit: 'cover' }} />
        <Audio src={videoUrl} />
      </AbsoluteFill>
      <AbsoluteFill style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '10%' }}>
        {segments.map((segment, index) => {
          const startFrame = Math.round(segment.start * fps);
          const endFrame = Math.round(segment.end * fps);
          return (
            <Sequence key={index} from={startFrame} durationInFrames={endFrame - startFrame}>
              <div style={{ width: '100%', textAlign: 'center', fontSize: '60px', fontWeight: 'bold', color: 'white' }}>
                {segment.text}
              </div>
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default VideoExport;
```

**Demo:**
The POC is available in `research/pocs/remotion-export/VideoExport.tsx`. When integrated with Remotion Studio, this renders a video player where text automatically appears and disappears precisely synced to the transcription timestamps.

**Performance:**
- Rendering is slower than raw stream copying with FFmpeg but allows infinite visual customization.
- Impact: Tradeoff between rendering speed and visual quality.

### 📈 Value Proposition

**Benefits:**
- ✅ Unlocks highly stylized, viral-ready video clips with custom animations and branded themes.
- ✅ Uses standard React and CSS for styling instead of complex FFmpeg filters.
- ✅ Easily integrates with our existing React/Next.js stack and transcript data models.

**User stories:**
- As a creator, I can export a highlight with big, dynamic "TikTok-style" captions so that my video performs better on social media.
- As a brand manager, I can apply my custom fonts, colors, and logos directly to the exported video without needing external video editing software.

### ⚖️ Trade-offs

**Pros:**
- ✅ React-based API is developer-friendly and maintainable.
- ✅ Pixel-perfect control over UI elements (CSS, fonts, SVGs).
- ✅ Extremely extensible for new templates.

**Cons:**
- ❌ Slower rendering times compared to raw FFmpeg stream copying.
- ❌ Licensing costs for commercial use.
- ❌ Requires setting up a scalable rendering infrastructure (e.g., AWS Lambda for `@remotion/lambda`).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| FFmpeg with `drawtext` | Free, runs everywhere, fast. | Horrible developer experience, extremely limited styling/animations. | Not chosen because it cannot deliver the modern visual polish required for social media. |
| Puppeteer + FFmpeg | Free, uses HTML/CSS. | Fragile, very slow, hard to sync audio/video perfectly. | Not chosen because Remotion solves exactly this problem natively. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Review Remotion commercial licensing.
- [ ] Set up a basic Remotion composition in the project (`remotion/Root.tsx`).
- [ ] Create a `VideoExport` template.

**Phase 2: Core Feature** (estimated: 4 days)
- [ ] Integrate the existing Whisper transcript data into the Remotion composition.
- [ ] Build basic word-level and segment-level caption animations.
- [ ] Implement local Remotion rendering API route.

**Phase 3: Polish & Testing** (estimated: 3 days)
- [ ] Evaluate and integrate `@remotion/lambda` for scalable cloud rendering.
- [ ] Add theming options (colors, fonts, sizes).
- [ ] Update frontend UI to trigger the new export flow.

**Total estimated effort:** 9 developer-days

**Dependencies:**
- `remotion`
- `@remotion/player`
- `@remotion/lambda` (optional, for scalable rendering)

**Risks:**
- ⚠️ Cloud rendering costs and infrastructure complexity - Mitigation: Start with server-side Node.js rendering on our current hosting to validate before moving to AWS Lambda.
- ⚠️ Licensing issues - Mitigation: Explicitly review the Remotion Company License before deploying to production.

### 📚 Resources

**Documentation:**
- [Remotion Docs](https://www.remotion.dev/docs)
- [Burn-in Subtitles Example](https://www.remotion.dev/docs/captioning)

**Examples:**
- [GitHub Unwrapped](https://github.com/remotion-dev/github-unwrapped-2023)

### 🎬 Next Steps

**If approved:**
1. Secure approval for potential licensing costs.
2. Initialize Remotion in a feature branch.
3. Build the first animated caption template based on the POC.

### 💬 Discussion Points
- Should we offer different export tiers (fast/basic via FFmpeg vs. slow/stylized via Remotion)?
- Can we offset the cloud rendering costs by making stylized exports a premium feature?
