## 🔬 Researcher: Remotion for Advanced Video Export

### 🎯 Executive Summary
Integrate [Remotion](https://www.remotion.dev/) to replace basic FFmpeg clip extraction with programmatic, React-based video rendering. This enables high-quality, burned-in dynamic captions and custom backgrounds, elevating the output from plain clips to engaging, social-media-ready content.

### 💡 Problem Statement
**Current situation:**
Currently, users can only export raw cropped video files via FFmpeg or raw text/SRT files.

**User impact:**
Users wanting to post highlights directly to social platforms (TikTok, Instagram Reels, YouTube Shorts) must take the exported video and SRT into a third-party editor (like CapCut or Premiere) to add the dynamic, burned-in captions that perform best on those platforms.

**Example scenario:**
A podcaster uses the application, identifies a fantastic 45-second highlight, but cannot share it immediately. They must download the MP4, download the SRT, open Premiere, sync them, style the captions, and export again.

### 🚀 Proposed Solution
**What:**
Implement Remotion as the rendering engine for video exports. Remotion allows us to write React components that map over transcription segments to automatically burn in animated, styled captions onto the video during a server-side or Lambda-based render.

**How it works:**
1. A user selects a highlight in the UI and clicks "Export Video with Captions".
2. The UI sends the highlight's metadata (start/end times, and the `TranscriptionSegment` array) to a Remotion rendering endpoint.
3. A Remotion `<Composition>` uses the audio/video file and loops through the segments, dynamically displaying the current text frame-by-frame.
4. The backend uses `@remotion/lambda` or local `@remotion/bundler` to render the MP4 and return a download link.

**Why this approach:**
Because our entire application state (highlights and precise transcription segments) is already structured in React and JSON, Remotion fits perfectly. It allows us to style the captions using the Tailwind CSS we already know, rather than dealing with complex FFmpeg `drawtext` string escaping.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Remotion v4.x
- **Maturity:** Stable, battle-tested for programmatic video generation.
- **Adoption:** Used widely for automated short-form content generation.
- **Community:** Active Discord, 16k+ GitHub stars.
- **License:** Remotion requires a company license for for-profit businesses above certain revenue, but is free for individuals/small teams (under 3 people). We must evaluate if this fits our exact business model.
- **Bundle size:** Does not impact client bundle if rendered via API/Lambda.

**Competitive Analysis:**
- OpusClip / Veed.io: Provide one-click, highly-styled captioned videos.
- Our App: Currently only provides raw text and raw trimmed video.

**Best Practices:**
Serverless rendering with `@remotion/lambda` is recommended for high-concurrency environments to avoid blocking the main backend thread.

### 🧪 Proof of Concept

**Implementation:**
```tsx
import React from 'react';
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface HighlightVideoProps {
  audioUrl: string;
  segments: TranscriptSegment[];
  highlightStart: number;
  highlightEnd: number;
}

export const HighlightVideo: React.FC<HighlightVideoProps> = ({
  audioUrl,
  segments,
  highlightStart,
  highlightEnd,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Determine current active segment for burned-in captions
  const currentTime = highlightStart + frame / fps;
  const activeSegment = segments.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
      <Sequence from={0} durationInFrames={Math.ceil((highlightEnd - highlightStart) * fps)}>
        <Audio src={audioUrl} startFrom={Math.ceil(highlightStart * fps)} />
      </Sequence>

      {activeSegment && (
        <div
          style={{
            position: 'absolute', bottom: '10%', color: 'white', fontSize: '48px',
            fontFamily: 'sans-serif', textAlign: 'center', padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: '10px', maxWidth: '80%',
          }}
        >
          {activeSegment.text}
        </div>
      )}
    </AbsoluteFill>
  );
};
```

### 📈 Value Proposition

**Benefits:**
- ✅ Massively reduces user friction (skip CapCut entirely).
- ✅ Increases the perceived value of the application, moving it from a "transcriber" to a "content generator".
- ✅ High potential for virality if videos can be watermarked on free tiers.

**User stories:**
- As a creator, I can export a fully captioned 60-second clip so that I can immediately post it to TikTok.

### ⚖️ Trade-offs

**Pros:**
- ✅ Unlocks premium "social media ready" export features.
- ✅ Uses React/Tailwind for video styling instead of complex C++/FFmpeg.

**Cons:**
- ❌ Requires setting up serverless rendering architecture (AWS Lambda).
- ❌ Remotion's licensing model needs careful review for commercialization.
- ❌ Rendering video costs compute money.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| FFmpeg `drawtext` | Free, no new deps | Extremely painful to style, hard to animate | Not chosen due to DX and limited styling capabilities. |
| Browser canvas recording | Zero server costs | Inconsistent frame rates, blocks UI thread | Not chosen due to unreliability. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Evaluate Remotion commercial licensing.
- [ ] Setup standalone Remotion project within the monorepo/directory.
- [ ] Implement base Composition with our Tailwind styles.

**Phase 2: Core Feature** (estimated: 3 days)
- [ ] Map `TranscriptionSegment` data accurately to Remotion frames.
- [ ] Add word-level highlighting animations.
- [ ] Configure `@remotion/lambda` deployment for cloud rendering.

**Phase 3: Polish & Testing** (estimated: 2 days)
- [ ] Integrate API call from Next.js frontend to trigger render.
- [ ] Add download status polling and UI feedback.
- [ ] Add basic styling options (font, color) in the UI.

**Total estimated effort:** 7 developer-days

**Dependencies:**
- `remotion`
- `@remotion/lambda`

**Risks:**
- ⚠️ Cloud rendering costs could spiral - Mitigation: Implement strict duration limits and rate limits per user.
- ⚠️ Licensing incompatibility - Mitigation: Review terms; fallback to basic FFmpeg if terms block our usage.

### 📚 Resources

**Documentation:**
- [Remotion Docs](https://www.remotion.dev/docs)
- [Remotion Lambda](https://www.remotion.dev/docs/lambda)

### 🎬 Next Steps

**If approved:**
1. Review Remotion's license to ensure it fits the AudioHighlights business model.
2. Prototype an AWS Lambda render to calculate unit economics per minute of video.
3. Design the caption styling and selection UI.

### 💬 Discussion Points
- Should we charge users per minute of rendered video to offset cloud costs?
- Are we comfortable introducing AWS dependencies to our Vercel/Railway stack?
