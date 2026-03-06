## 🔬 Researcher: Advanced Video Export with Remotion (Burned-in Captions & Visualizers)

### 🎯 Executive Summary
Integrate [Remotion](https://www.remotion.dev/) to replace our basic server-side FFmpeg clip extraction with an advanced, programmatic React-based video rendering engine. This will enable dynamic burned-in captions (TikTok/Reels style), custom backgrounds, and audio visualizers directly within our export pipeline, significantly increasing the viral potential and shareability of the generated highlights.

### 💡 Problem Statement
**Current situation:**
Currently, AudioHighlights extracts highlights using a basic stream copy or re-encoding via a server-side FFmpeg microservice. While fast, the output is a raw video/audio clip. Users must take this raw clip into another tool (like CapCut or Premiere) to add captions, progress bars, or visualizers to make it ready for social media (TikTok, Instagram Reels, YouTube Shorts).

**User impact:**
Content creators (our primary users) face friction because they have to use secondary tools to finalize their clips. This breaks their workflow and increases the time-to-publish.

**Example scenario:**
A user generates a fantastic 45-second highlight from a 2-hour podcast. They download the MP4. To post it to TikTok, they must open the MP4 in CapCut, manually add and style captions, perhaps add a waveform visualizer for the audio-only segments, render it again, and then upload.

### 🚀 Proposed Solution
**What:**
Introduce Remotion as the rendering engine for our video exports. Remotion allows us to write videos using standard React code. We will build a template that takes the raw media clip, the exact transcript segments (which we already have from Whisper), and rendering settings to generate a final, polished video.

**How it works:**
1. User selects a highlight and chooses "Export as Social Video".
2. The frontend triggers a serverless/cloud function running `@remotion/lambda`.
3. The lambda receives:
   - The media URL (start/end times).
   - The specific transcript array for that segment (with word/segment level timings).
   - Theme settings (colors, background, waveform style).
4. Remotion renders a React composition (`VideoWithCaptions`) frame-by-frame, burning the dynamic captions and visualizer into the video.
5. The user receives a finalized `.mp4` ready for direct upload to social platforms.

**Why this approach:**
- We already have high-quality, timestamped transcripts from our AI pipeline. Remotion allows us to map these exact timestamps to video frames programmatically using React, a paradigm our team is already highly proficient in.
- It offloads heavy video encoding from our simple FFmpeg microservice to optimized, parallelized AWS Lambda functions via `@remotion/lambda`.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Remotion (v4.x)
- **Maturity:** Stable (widely used in production by major creators/companies)
- **Adoption:** GitHub, Fireship, Spotify (similar tech), Daily.dev
- **Community:** 20k+ GitHub stars, very active Discord, excellent documentation.
- **License:** Remotion Company License (Free for individuals and small companies < 3 employees, paid for larger commercial use. Needs verification against our company size).
- **Bundle size:** N/A for frontend (rendering happens via serverless lambda or dedicated server), but adds significant dev dependencies.

**Competitive Analysis:**
- OpusClip / Munch: All provide burned-in, dynamic (often word-by-word) captions as their core value proposition. Our current raw export is far behind this standard.
- Riverside.fm: Offers an integrated editor to add captions and styles before export.

**Best Practices:**
- Use `@remotion/lambda` for scalable cloud rendering rather than client-side rendering (which is slow and memory-intensive).
- Pass transcript data as JSON props to the composition.
- Use `useCurrentFrame` and `useVideoConfig` to sync animations with exact transcript timestamps.

### 🧪 Proof of Concept

**Implementation:**
A minimal React component demonstrating dynamic caption mapping to video frames.
```tsx
// Link to POC: research/pocs/remotion-export/index.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

const mockTranscriptSegments = [
  { start: 0, end: 1.5, text: "Welcome to" },
  { start: 1.5, end: 3.0, text: "AudioHighlights," },
  // ...
];

export const VideoWithCaptions = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const currentCaption = mockTranscriptSegments.find(
    (item) => currentTime >= item.start && currentTime < item.end
  );

  return (
    <AbsoluteFill>
      {/* Background / Visualizer / Source Video */}
      <AbsoluteFill style={{ justifyContent: 'flex-end', paddingBottom: '80px' }}>
        {currentCaption && (
           <span style={{ backgroundColor: 'rgba(59,130,246,0.9)' }}>
             {currentCaption.text}
           </span>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

**Performance:**
- Before: FFmpeg server stream copy (~2-5 seconds, but raw output).
- After: Remotion Lambda render (~15-30 seconds depending on duration and effects, but production-ready output).
- Impact: Increased compute time, but saves the user 10-20 minutes of manual editing.

### 📈 Value Proposition

**Benefits:**
- ✅ **Retention & Viral Loops:** Videos with dynamic captions have significantly higher retention rates on TikTok/Reels. Our generated clips will perform better, bringing more users back to AudioHighlights.
- ✅ **Complete Workflow:** We become an end-to-end solution, preventing users from needing CapCut or Premiere.
- ✅ **Monetization:** Premium video rendering with custom branding/fonts is an excellent feature to gate behind a paid Pro tier.

**User stories:**
- As a podcaster, I can export a highlight with burned-in, animated captions so that I can immediately post it to TikTok without opening a video editor.

### ⚖️ Trade-offs

**Pros:**
- ✅ Unlocks massive product value (social-ready clips).
- ✅ Code-as-video approach fits perfectly into our React/Next.js stack.
- ✅ Highly customizable (we can build endless themes/templates).

**Cons:**
- ❌ **Cost:** Cloud rendering (AWS Lambda) incurs continuous compute costs per render.
- ❌ **Licensing:** Remotion is not MIT licensed; we must comply with their company license limits or pay.
- ❌ **Complexity:** Adds a complex infrastructure piece (Lambda deployment) alongside our existing FFmpeg service.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| FFmpeg complex filter (`drawtext` with ASS subtitles) | Free, uses existing infra | Extremely hard to style dynamically, no word-level pop animations, brittle syntax. | Not chosen because it cannot achieve modern TikTok-style dynamic layouts easily. |
| Client-side canvas recording | Free compute (uses user's device) | Extremely slow, unreliable, hangs the browser UI. | Not chosen because it provides a poor UX. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 3 days)
- [ ] Research Remotion commercial license compatibility.
- [ ] Set up a basic Remotion project within our monorepo or as a separate service.
- [ ] Create a static `Composition` that accepts a video URL and a hardcoded JSON transcript.

**Phase 2: Core Feature (Lambda Setup)** (estimated: 4 days)
- [ ] Configure `@remotion/lambda` and deploy to an AWS account.
- [ ] Create an API endpoint (`/api/export-video`) in Next.js that triggers the Lambda render job.
- [ ] Implement polling or webhooks to track render progress in the UI.

**Phase 3: Polish & Styling** (estimated: 5 days)
- [ ] Build 2-3 high-quality templates (e.g., "Neon Hacker", "Minimalist Clean").
- [ ] Implement audio visualizer component for audio-only podcast highlights.
- [ ] Integrate word-level timings if supported by our Whisper API output.

**Total estimated effort:** 12 developer-days

**Dependencies:**
- `remotion`
- `@remotion/lambda`
- AWS Account (for Lambda rendering)

**Risks:**
- ⚠️ **Cloud Costs scaling linearly** - Mitigation: Introduce rendering quotas per user or require a paid tier for this specific export type.
- ⚠️ **Render latency** - Mitigation: Show a robust progress bar in the UI and allow background processing with email/notification completion.

### 📚 Resources

**Documentation:**
- [Remotion Docs](https://www.remotion.dev/docs)
- [Remotion Lambda Guide](https://www.remotion.dev/docs/lambda)

**Examples:**
- [Fireship code-in-motion example (similar vibe)](https://github.com/fireship-io/remotion-trailer)

### 🎬 Next Steps

**If approved:**
1. Verify license terms with leadership.
2. Provision an AWS sandbox environment for Lambda testing.
3. Integrate the POC composition into a local Remotion studio environment to test with real whisper JSON data.

**Questions to resolve:**
- [ ] Do we restrict this to paid users immediately due to compute costs?
- [ ] Are our current Whisper transcription segments granular enough, or do we need word-level timestamps enabled from the Groq API?

### 💬 Discussion Points
- Should we keep the existing FFmpeg microservice for fast, raw downloads, and offer Remotion as an "Advanced Export" option?
- Are there specific caption styles our users are asking for the most?
