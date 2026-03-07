## 🔬 Researcher: Remotion for Advanced Video Export

### 🎯 Executive Summary
Replace complex FFmpeg CLI strings for burning captions onto video with a **React-based rendering pipeline using Remotion**. This upgrade allows us to programmatically generate viral-ready (9:16 vertical) clips with dynamic, styled, word-level "karaoke" captions using the exact same React components and CSS we use for the web frontend.

### 💡 Problem Statement
**Current situation:**
Currently, exporting video clips involves basic trimming via `ffmpeg-service` (stream copy or simple re-encode). We lack the ability to burn highly stylized, animated captions ("viral style") into the final exported MP4. Attempting to do this with FFmpeg's `drawtext` filter requires complex, unmaintainable string interpolation, lacks CSS styling (like text shadows and fonts), and cannot easily animate individual words.

**User impact:**
- Content creators must download plain clips and use external tools (like CapCut, Premiere, or Veed.io) to add the mandatory vertical crop and animated subtitles required for TikTok/Reels/Shorts.

**Example scenario:**
A podcaster uses AudioHighlights to find a great 30-second quote. They download it. It's a horizontal 16:9 MP4 with no subtitles. They then have to spend another 10 minutes in CapCut converting it to 9:16 and styling the auto-captions before posting to TikTok.

### 🚀 Proposed Solution
**What:**
Implement a new export pipeline using [Remotion](https://www.remotion.dev/). Remotion allows us to write video rendering logic using React, meaning we can use standard HTML/CSS to layout a 9:16 canvas, place the cropped video, and overlay our transcript `Word` data as animated text.

**How it works:**
1.  **Frontend/Backend:** We define a Remotion `<Composition>` that takes `videoUrl` and `transcriptWords` as props.
2.  **Rendering:** We deploy `@remotion/lambda` (or run `@remotion/cli` on a server worker) to render the composition into an MP4 file.
3.  **Output:** The result is a fully composited video with burned-in HTML/CSS captions perfectly synced to the audio using the word-level timestamps we already generate via Whisper.

**Why this approach:**
- **Developer Experience (DX):** We already know React. Building complex text animations in React is trivial compared to FFmpeg's low-level filters.
- **Flexibility:** We can add custom backgrounds, progress bars, branded logos, and complex text styling (shadows, strokes, custom fonts) with standard web technologies.
- **Consistency:** The captions rendered in the final video can look exactly like the "Karaoke Mode" captions in the web UI.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `remotion` / `@remotion/player` / `@remotion/lambda`
- **Maturity:** Stable, battle-tested in production (used by GitHub for "Unwrapped", Fireship, etc.).
- **Adoption:** Rapidly growing standard for programmatic video generation.
- **Community:** 18k+ GitHub stars, very active Discord.
- **License:** MIT for individuals and small companies; commercial license required for large enterprises.
- **Bundle size:** Relevant only for the rendering worker, negligible impact on the main web client if using server-side rendering or lambda.

**Competitive Analysis:**
- **OpusClip / Veed.io / Riverside:** All offer "Magic Clips" which output vertical video with animated burned-in captions. This is the industry standard expectation.
- **Our App:** Currently outputs unstyled horizontal cuts.

**Best Practices:**
- Separate the Remotion project from the main Next.js app to keep build times fast and dependencies clean.
- Use `@remotion/lambda` for scalable, concurrent video rendering on AWS without managing FFmpeg clusters.

### 🧪 Proof of Concept

**Implementation:**
A simple POC `CaptionOverlay.tsx` was created in `research/pocs/remotion-export/`.

```tsx
// research/pocs/remotion-export/CaptionOverlay.tsx
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export const CaptionOverlay = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  return (
    <div style={{ /* positioning logic for bottom third */ }}>
      {words.map((w, index) => {
        const isActive = currentTime >= w.start && currentTime <= w.end;
        return (
          <span
            key={index}
            style={{
              color: isActive ? '#facc15' : 'white',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
              /* styling */
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};
```

**Demo:**
The POC maps the `start` and `end` times of each word to the current frame time (`frame / fps`). If the word is active, it receives a different color and CSS transform, creating the "karaoke" pop effect.

**Performance:**
- Rendering is slower than stream-copy FFmpeg, but comparable to FFmpeg with complex `filter_complex` re-encoding.
- `@remotion/lambda` splits rendering across multiple serverless functions, often completing a 1-minute video in < 30 seconds.

### 📈 Value Proposition

**Benefits:**
- ✅ **Complete Workflow:** Users can generate final, ready-to-post social media assets entirely within AudioHighlights.
- ✅ **Premium Feature:** Branded, high-quality subtitles are a strong up-sell or core differentiator.
- ✅ **Maintainability:** Writing subtitle animations in React/CSS is vastly superior to debugging FFmpeg text filters.

**User stories:**
- As a Social Media Manager, I can export a 9:16 clip with Alex Hormozi-style captions directly from my podcast upload so that I can immediately post it to TikTok without opening an external editor.

### ⚖️ Trade-offs

**Pros:**
- ✅ Best-in-class DX for programmatic video.
- ✅ Unlimited styling and animation capabilities.
- ✅ Leverages our existing React/Tailwind knowledge.

**Cons:**
- ❌ **Infrastructure Complexity:** Requires setting up a dedicated rendering worker or AWS Lambda integration.
- ❌ **Cost:** Rendering video on Lambda incurs cloud compute costs per minute of video.
- ❌ **Licensing:** Need to ensure our revenue/company size complies with Remotion's license terms.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **FFmpeg `drawtext`** | Free, already using FFmpeg | Abysmal DX, limited styling, extremely hard to do word-level animations | Rejected |
| **Client-side Canvas rendering** | Free compute (runs on user device) | Very slow, prone to OOM errors, inconsistent browser codecs | Rejected |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Initialize a new Remotion project within the monorepo (`packages/video-renderer`).
- [ ] Build the core `Composition` that accepts video URL and transcript JSON.
- [ ] Implement the 9:16 crop logic and basic Caption overlay.

**Phase 2: Integration & Infrastructure** (estimated: 3 days)
- [ ] Set up `@remotion/lambda` in our AWS account.
- [ ] Create a new Next.js API route `/api/export-video` that triggers the Lambda render.
- [ ] Implement polling/webhooks to update the UI on render progress.

**Phase 3: Polish & Templates** (estimated: 2 days)
- [ ] Add multiple subtitle styles (e.g., "Classic", "Viral Pop", "Minimalist").
- [ ] Add user controls in the Export modal to select output format and caption style.

**Total estimated effort:** 7 developer-days

**Dependencies:**
- `remotion`
- `@remotion/lambda`
- AWS Account setup

**Risks:**
- ⚠️ **Lambda Limits:** AWS Lambda has execution time and memory limits. *Mitigation: Remotion Lambda is specifically designed to work around this by chunking rendering, but we must test with long clips.*
- ⚠️ **Cost Overruns:** Unrestricted rendering could spike AWS bills. *Mitigation: Implement strict rate limiting and max duration constraints (e.g., max 60s clips).*

### 📚 Resources

**Documentation:**
- [Remotion Docs](https://www.remotion.dev/docs)
- [Remotion Lambda](https://www.remotion.dev/docs/lambda)
- [FFmpeg vs Remotion](https://www.remotion.dev/docs/ffmpeg)

### 🎬 Next Steps

**If approved:**
1. Review Remotion licensing against our business model.
2. Initialize the Remotion sub-package to begin prototyping the layout.
3. Provision an AWS IAM role for testing `@remotion/lambda`.