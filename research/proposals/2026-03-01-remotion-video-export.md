## 🔬 Researcher: Rich Video Export with Remotion

### 🎯 Executive Summary
I propose integrating **Remotion** to upgrade our video export capabilities from simple FFmpeg cuts to rich, branded video clips. This will allow us to offer features like burned-in dynamic captions (karaoke style), progress bars, custom backgrounds, and platform-specific aspect ratios directly from the browser, significantly increasing the viral potential of the generated highlights.

### 💡 Problem Statement
**Current situation:**
Currently, our `cutVideo` and `cutMixVideo` functionality relies on a server-side FFmpeg microservice. It performs raw cuts and concatenations (stream copy).
1.  **Basic Output:** The resulting video is just the raw footage. It lacks the standard "viral clip" elements that users expect (big captions, progress bars, branded frames).
2.  **No Aspect Ratio Control:** A horizontal YouTube podcast video remains horizontal when exported. Users have to use third-party apps (like CapCut or Premiere) to crop it to 9:16 for TikTok/Reels and add text.
3.  **Server Dependency:** While the cuts are fast, generating complex visuals via FFmpeg on the backend is CPU-intensive and hard to iterate on.

**User impact:**
Content creators still need an external tool to finalize their clips before posting. This breaks the promise of an "end-to-end" viral clip generator.

**Example scenario:**
A user generates a great 45-second highlight from their podcast. They download the `.mp4`. However, to post it to TikTok, they must open CapCut, import the video, crop it to 9:16, add auto-captions, and render it again.

### 🚀 Proposed Solution
**What:**
Integrate [Remotion](https://www.remotion.dev/), a React framework for creating videos programmatically, into our application.

**How it works:**
1.  **Template Definition:** We create React components that represent video templates (e.g., `TikTokTemplate`, `YouTubeShortTemplate`). These components use standard HTML/CSS to define layout, fonts, and colors.
2.  **Data Hydration:** We pass the highlight data (the source video URL, the specific `startTime` and `endTime`, and the `words` array from the `TranscriptionSegment`) into the Remotion composition.
3.  **Client-Side Rendering:** Remotion's `@remotion/player` allows the user to preview the *exact* final video in the browser.
4.  **Export:** Remotion's `@remotion/renderer` (or a serverless function) compiles the React component sequence into an MP4 file with burned-in captions and graphics.

**Why this approach:**
-   **React Ecosystem:** We can build video templates using the exact same Tailwind CSS and React skills we already use for the UI. No need to learn complex FFmpeg filter graphs.
-   **Dynamic Captions:** Since we already have word-level timestamps (`TranscriptionSegment.words`), creating karaoke-style highlighted captions is trivial in React.
-   **Previewability:** Users can preview and tweak the template (colors, font size) in real-time before rendering.

### 📊 Research Findings

**Technology Analysis:**
-   **Library/Framework:** Remotion (v4.x)
-   **Maturity:** Stable, widely used in production for programmatic video.
-   **Adoption:** Used by companies like GitHub (for unwrap videos), Spotify, and numerous AI clip generators.
-   **Community:** 18k+ GitHub stars, very active Discord, excellent documentation.
-   **License:** Free for individuals and small companies; requires a license for larger commercial use (need to verify our specific tier, but generally startup-friendly).
-   **Bundle size:** The Player is client-side (~100kb), the Renderer runs in a Node environment or Lambda.

**Competitive Analysis:**
-   **OpusClip / Munch:** Generate complete, styled vertical videos with captions. (This proposal brings us to parity with them).
-   **Descript:** Offers basic templates and burned-in captions.
-   **Our App (Current):** Only raw MP4 cuts.

**Best Practices:**
-   **Asset Handling:** Use pre-signed URLs or robust CDNs for the source video to ensure the renderer can access it quickly.
-   **Audio Sync:** Rely on Remotion's `Audio` and `Video` components, which handle synchronization automatically based on frame rates.

### 🧪 Proof of Concept

**Implementation:**
This is a conceptual React snippet of how a highlight template would look:

```tsx
// src/components/video-templates/ViralClip.tsx
import { AbsoluteFill, Sequence, Video, useCurrentFrame, useVideoConfig } from 'remotion';

export const ViralClip = ({ sourceVideoUrl, highlightStart, highlightDuration, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Find the currently spoken word
  const activeWord = words.find(w =>
     currentTime >= w.start - highlightStart &&
     currentTime <= w.end - highlightStart
  );

  return (
    <AbsoluteFill className="bg-black flex items-center justify-center">
      {/* 9:16 Cropped Video */}
      <Sequence from={0} durationInFrames={highlightDuration * fps}>
        <Video
          src={sourceVideoUrl}
          startFrom={highlightStart * fps}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Sequence>

      {/* Dynamic Captions overlay */}
      <AbsoluteFill className="justify-center items-center pb-40">
        {activeWord && (
          <h1 className="text-6xl font-black text-white text-center uppercase drop-shadow-2xl"
              style={{ WebkitTextStroke: '2px black' }}>
            {activeWord.word}
          </h1>
        )}
      </AbsoluteFill>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-4 bg-yellow-500"
           style={{ width: `${(currentTime / highlightDuration) * 100}%` }} />
    </AbsoluteFill>
  );
};
```

**Performance:**
-   **Preview:** Real-time 60fps in the browser.
-   **Render Time:** Depends on the backend setup. A 60-second clip typically renders in 10-20 seconds on a standard AWS Lambda instance using `@remotion/lambda`.

### 📈 Value Proposition

**Benefits:**
-   ✅ **End-to-End Workflow:** Users get a ready-to-post TikTok/Reel, eliminating the need for CapCut.
-   ✅ **High Perceived Value:** Burned-in, animated captions look highly professional and increase retention.
-   ✅ **Customizability:** We can easily offer different "Themes" (Gaming, Corporate, News) by just swapping React components.

**User stories:**
-   As a podcaster, I want to download a vertical video with big captions so I can upload it straight to TikTok without further editing.
-   As a marketer, I want to add my brand colors to the captions of the generated highlights.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Developer experience is unmatched (just write React).
-   ✅ Pixel-perfect control over the output.
-   ✅ Easy to animate text and elements using standard CSS/Framer Motion within Remotion.

**Cons:**
-   ❌ **Architecture Shift:** Requires setting up a rendering pipeline (either a dedicated Node server or AWS Lambda) for the final MP4 generation. It cannot render the final MP4 entirely client-side efficiently.
-   ❌ **Cost:** Rendering videos in the cloud incurs compute costs (Lambda invocation time).
-   ❌ **Complexity:** Handling large video files across the network to the renderer requires careful architecture (S3 presigned URLs, etc.).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| FFmpeg Complex Filters | No new infrastructure needed. | Writing complex `drawtext` and `crop` filter graphs is incredibly difficult, fragile, and hard to maintain. Hard to preview. | Not chosen because the developer experience is too poor for rapid template iteration. |
| WebCodecs API | Client-side rendering (free). | Very low-level, experimental, requires manual frame encoding and audio muxing. No React abstraction. | Not chosen because it's too low-level and risky for production right now. |

### 🛠️ Implementation Plan

**Phase 1: Foundation & Player** (estimated: 3 days)
-   [ ] Install `remotion` and `@remotion/player`.
-   [ ] Create a basic 9:16 `ViralClip` template component.
-   [ ] Integrate `@remotion/player` into the `HighlightCard` to replace the standard HTML5 video player, allowing users to preview the cropped, captioned version.

**Phase 2: Renderer Setup** (estimated: 4 days)
-   [ ] Evaluate `@remotion/lambda` vs a dedicated Node.js rendering queue.
-   [ ] Set up the rendering backend.
-   [ ] Create an API route to trigger a render job and poll for status.

**Phase 3: Polish & Customization** (estimated: 3 days)
-   [ ] Refine caption animations (word-by-word reveal).
-   [ ] Add UI controls to change aspect ratio (16:9, 1:1, 9:16) and caption styles.
-   [ ] Handle edge cases (missing words array, very long text).

**Total estimated effort:** 10 developer-days

**Dependencies:**
-   `remotion`, `@remotion/player`, `@remotion/bundler`
-   AWS Account (if using `@remotion/lambda`)

**Risks:**
-   ⚠️ **Render Costs** - Mitigation: Implement strict duration limits and rate limiting for the rendering API.
-   ⚠️ **Large Video Uploads** - Mitigation: Since we already process the video server-side for FFmpeg, ensure the source video is stored temporarily in an accessible bucket (e.g., S3) for the Remotion renderer to read.

### 📚 Resources

**Documentation:**
-   [Remotion Documentation](https://www.remotion.dev/docs/)
-   [Remotion Lambda Guide](https://www.remotion.dev/docs/lambda)

**Examples:**
-   [Remotion Text Reveal Animations](https://www.remotion.dev/docs/miscellaneous/text-animation)

**Community:**
-   [Remotion Discord](https://discord.gg/remotion)

### 🎬 Next Steps

**If approved:**
1.  Verify the Remotion licensing terms for our specific business structure.
2.  Build a local, client-side only POC using `@remotion/player` to validate the UI experience of the dynamic captions.
3.  Design the cloud architecture for the rendering pipeline.

### 💬 Discussion Points
-   Should we use AWS Lambda (`@remotion/lambda`) for infinite scaling, or run `@remotion/renderer` on our existing Railway instance?
-   Do we want to offer watermarked exports for free users and un-watermarked for paid?
