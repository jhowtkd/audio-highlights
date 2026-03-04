## 🔬 Researcher: Remotion Video Export Integration

### 🎯 Executive Summary
Propose integrating Remotion to enable high-quality programmatic video exports. This will allow users to generate final video clips with dynamic, burned-in captions, custom backgrounds, and visual elements directly from the browser, avoiding complex server-side video rendering.

### 💡 Problem Statement
**Current situation:**
- The application currently relies on FFmpeg for simple video cuts and stream copying, which is fast but inflexible.
- Users can export SRT/VTT subtitles, but they must use external tools (like Premiere, CapCut, or Descript) to actually burn these captions into their video clips with styling.

**User impact:**
- Content creators lose time switching between our app (for transcription/selection) and another tool for final styling and rendering.
- The lack of an all-in-one "export ready-to-post video" feature reduces the perceived value of the product compared to competitors.

**Example scenario:**
- A podcaster generates a great 60-second highlight. They want to post it to TikTok immediately, complete with the viral "Karaoke-style" captions they just previewed in our app. Currently, they have to download the video, download the SRT, open CapCut, import both, style the captions, and re-export.

### 🚀 Proposed Solution
**What:**
Integrate `remotion` and `@remotion/player` to construct React-based video compositions that combine the source video/audio with dynamic, styled React components (captions, progress bars, logos).

**How it works:**
- We build a Remotion `<Composition>` that takes the source media URL and the generated transcript/highlights as props.
- The `<Player>` component allows users to preview the exact final video in the browser.
- We use `@remotion/lambda` or a dedicated render worker (using `@remotion/bundler` and Puppeteer) to render the React composition into an MP4 file when the user clicks "Export Video".

**Why this approach:**
- **Familiarity:** Allows us to style video elements using standard React and Tailwind CSS, which our team already knows.
- **Flexibility:** Enables complex animations, dynamic layouts, and exact visual parity between the web preview and the final video.
- **Ecosystem:** Remotion is the industry standard for programmatic video in React.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `remotion`, `@remotion/player`, `@remotion/lambda`
- **Maturity:** Highly Stable (Used in production by major companies).
- **Adoption:** GitHub, Spotify, Tailwind Labs.
- **Community:** 20k+ GitHub stars, very active Discord.
- **License:** Remotion requires a license for commercial use by companies exceeding certain revenue thresholds, but is free for individuals and small startups.
- **Bundle size:** The player adds some weight, but rendering can be entirely offloaded.

**Competitive Analysis:**
- **Descript:** Offers full timeline editing and styled burned-in captions.
- **OpusClip:** Provides AI-generated video clips with heavy, animated caption styles.
- **Our App:** Currently lacks burned-in captions and stylized video export.

**Best Practices:**
- Separate the Remotion composition code from the main app bundle to keep the initial load fast.
- Use `@remotion/player` for the preview and a serverless/worker approach for the actual MP4 encoding to prevent locking up the user's browser.

### 🧪 Proof of Concept

**Implementation:**
```tsx
// See research/pocs/remotion-export/poc.tsx for full code
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const CaptionSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const activeCaption = transcript.find(c => frame >= c.startFrame && frame < c.endFrame);

  return (
    <AbsoluteFill>
      {/* Video Background */}
      <Video src={sourceVideoUrl} />
      {/* Burned-in Caption */}
      {activeCaption && <div className="caption-style">{activeCaption.text}</div>}
    </AbsoluteFill>
  );
};
```

**Demo:**
The POC (`research/pocs/remotion-export/poc.tsx`) demonstrates how a React component can map frames to specific transcript segments, rendering the correct text on top of a visual background dynamically.

**Performance:**
- Rendering performance depends on the server setup, but Lambda rendering is highly parallel and fast.

### 📈 Value Proposition

**Benefits:**
- ✅ **All-in-one Workflow:** Users can go from raw upload to final TikTok-ready video without leaving the app.
- ✅ **High Customization:** We can offer various template styles (gaming, podcast, minimalist) simply by changing React components.
- ✅ **Competitive Parity:** Brings our export capabilities up to the standard expected by modern creators.

**User stories:**
- As a **Content Creator**, I can **export my highlight as an MP4 with burned-in, styled captions** so that **I can post it directly to social media without using another editor.**

### ⚖️ Trade-offs

**Pros:**
- ✅ Pixel-perfect control over video styling using React/CSS.
- ✅ Exact match between the in-app preview and the final exported file.
- ✅ Extensible architecture (easy to add progress bars, watermarks, etc.).

**Cons:**
- ❌ **Infrastructure Complexity:** Requires setting up Remotion Lambda or a dedicated rendering server.
- ❌ **Cost:** Server-side rendering of video costs money (compute time).
- ❌ **Licensing:** Need to ensure compliance with Remotion's commercial license terms.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| FFmpeg `drawtext` | Free, no new infra | Extremely hard to style, no animations, complex filter graphs | Not chosen for styled captions |
| HTML5 Canvas + MediaRecorder | Client-side, free | Prone to lag, dropped frames, poor quality | Not chosen |

### 🛠️ Implementation Plan

**Phase 1: Foundation & Preview** (estimated: 3 days)
- [ ] Install `@remotion/player` and core dependencies.
- [ ] Create basic React compositions for different aspect ratios (9:16, 16:9).
- [ ] Integrate the Player into the Export modal for previewing.

**Phase 2: Rendering Infrastructure** (estimated: 5 days)
- [ ] Evaluate and setup Remotion Lambda (or Docker worker).
- [ ] Create the API endpoint to trigger render jobs.
- [ ] Implement polling/webhooks for render status.

**Phase 3: Templates & Polish** (estimated: 4 days)
- [ ] Build 2-3 distinct caption styles (e.g., Karaoke, Pop-up).
- [ ] Add controls for font size, color, and positioning in the UI.

**Total estimated effort:** 12 developer-days

**Dependencies:**
- `remotion`
- `@remotion/player`
- Infrastructure for `@remotion/lambda` or a dedicated worker.

**Risks:**
- ⚠️ **Render Costs:** High usage could lead to large compute bills.
  - *Mitigation:* Implement strict limits on video length for the initial rollout and consider a premium tier for this feature.
- ⚠️ **Sync Issues:** Ensuring the Remotion player stays perfectly synced with the original audio/video.
  - *Mitigation:* Rely on Remotion's built-in `Audio` and `Video` components which handle frame synchronization.

### 📚 Resources

**Documentation:**
- [Remotion Official Docs](https://www.remotion.dev/docs)
- [Remotion Player](https://www.remotion.dev/docs/player)
- [Remotion Lambda](https://www.remotion.dev/docs/lambda)

### 🎬 Next Steps

**If approved:**
1.  Verify Remotion licensing tier compatibility for our current stage.
2.  Set up a basic Remotion Lambda instance in an isolated AWS account to test actual rendering costs and speed.

### 💬 Discussion Points
- Should we charge users for this feature to offset the rendering compute costs?
- Do we want to allow users to upload their own custom fonts?