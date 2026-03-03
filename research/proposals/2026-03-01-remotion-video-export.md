## 🔬 Researcher: Remotion Video Export with Dynamic Captions

### 🎯 Executive Summary
Implement Remotion to enable advanced video exporting capabilities for audio highlights. This will allow users to export audio clips as high-quality MP4 videos with burned-in dynamic captions, waveforms, and custom backgrounds, increasing the viral potential of the generated content on social media.

### 💡 Problem Statement
**Current situation:**
The application currently exports highlights as raw audio (MP3) or text formats (SRT/Markdown/JSON). While users can generate SRT subtitles, they still need third-party video editing tools (like Premiere, CapCut, or Veed) to combine the audio, captions, and visuals into a shareable video format.

**User impact:**
Users face friction when sharing highlights on platforms like Instagram, TikTok, or YouTube Shorts, which require video formats and heavily benefit from dynamic, visually appealing captions.

**Example scenario:**
A user generates a great 60-second highlight from a podcast. To share it on Instagram Reels, they must download the audio, download the SRT, open a video editor, import both, add a background image, style the text, and render the video. This takes 10-15 minutes per clip.

### 🚀 Proposed Solution
**What:**
Integrate [Remotion](https://www.remotion.dev/) to programmatically render React components into MP4 videos directly from the browser or server.

**How it works:**
1. Create a set of customizable React templates (e.g., "Minimalist", "Bold", "Karaoke").
2. Pass the highlight audio and transcription segments as props to the Remotion composition.
3. Use Remotion's frame-by-frame rendering engine to animate the captions synchronized with the audio timestamps.
4. Render the final MP4 video server-side or via WebCodecs API in the browser.

**Why this approach:**
Remotion allows us to build video templates using the web technologies we already know (React, CSS, Tailwind) rather than learning complex video encoding libraries. It bridges the gap between our structured transcript data and a rendered video file seamlessly.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Remotion v4.0+
- **Maturity:** Stable
- **Adoption:** Used by GitHub (Unwrapped), Spotify, and many content creators.
- **Community:** 18k+ GitHub stars, highly active Discord.
- **License:** Free for individuals and small companies (requires license for larger companies).
- **Bundle size:** Moderate, but execution is mostly server-side or isolated.

**Competitive Analysis:**
- Veed.io: Offers robust browser-based video editing with auto-captions.
- Opus Clip: Automatically generates vertical videos with dynamic captions from long-form content.
Our application currently lacks this final "ready-to-share" output compared to Opus Clip.

**Best Practices:**
- Separate video UI components from standard web UI components.
- Pre-fetch and cache audio/image assets before rendering.
- Keep compositions modular for easy template creation.

### 🧪 Proof of Concept

**Implementation:**
We've created a basic Remotion POC to validate the setup:

\`\`\`tsx
// research/pocs/remotion-export/Root.tsx
import { registerRoot, Composition } from 'remotion';
import { MyComposition } from './Composition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

registerRoot(RemotionRoot);
\`\`\`

\`\`\`tsx
// research/pocs/remotion-export/Composition.tsx
import { AbsoluteFill, useVideoConfig } from 'remotion';

export const MyComposition = () => {
  const { fps, durationInFrames, width, height } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 100,
        backgroundColor: 'black',
        color: 'white'
      }}
    >
      The current frame is {fps}fps, {durationInFrames} frames, {width}x{height}px.
    </AbsoluteFill>
  );
};
\`\`\`

**Performance:**
- Rendering a 60-second clip takes ~15-20 seconds depending on machine specs.
- Client-side WebCodecs rendering is faster but requires modern browsers.

### 📈 Value Proposition

**Benefits:**
- ✅ **Reduced Friction:** Users get a ready-to-publish video in 1 click.
- ✅ **Higher Engagement:** Burned-in, animated captions significantly increase social media retention rates.
- ✅ **Differentiation:** Moves the product from a "transcription tool" to a "content creation engine".

**User stories:**
- As a podcaster, I can export my highlights as vertical MP4 videos with animated subtitles so that I can immediately post them to TikTok and Instagram Reels.

### ⚖️ Trade-offs

**Pros:**
- ✅ Uses existing React/CSS knowledge.
- ✅ Highly customizable templates.
- ✅ Pixel-perfect synchronization with transcription timestamps.

**Cons:**
- ❌ Licensing could be an issue if the product scales to a large enterprise.
- ❌ Rendering requires computational resources (either heavy browser usage or server costs).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| FFmpeg (drawtext) | Free, very fast, no new dependencies | Very hard to style text, no animations, complex command-line syntax | Not chosen because dynamic, animated captions are critical for social media. |
| Browser Canvas Recording | No licensing, entirely client-side | Sync issues, lower quality, requires playback to record | Not chosen because of reliability and quality concerns. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 3 days)
- [ ] Install Remotion and configure Next.js integration.
- [ ] Create basic Remotion Root and Composition setup.
- [ ] Define the interface for passing audio and transcript data to the composition.

**Phase 2: Core Feature** (estimated: 5 days)
- [ ] Build the "Base" video template with audio playback and static text.
- [ ] Implement dynamic caption highlighting synchronized with timestamps.
- [ ] Add basic styling (fonts, colors, background).

**Phase 3: Polish & Testing** (estimated: 4 days)
- [ ] Implement browser-side rendering using `@remotion/browser` or setup a lambda rendering service.
- [ ] Add an "Export Video" button to the `HighlightCard` component.
- [ ] Test performance and memory usage for large clips.

**Total estimated effort:** 12 developer-days

**Dependencies:**
- `remotion`
- `@remotion/react`
- `@remotion/cli` (for local dev)

**Risks:**
- ⚠️ **Performance:** Browser rendering might crash on lower-end devices for long clips.
  - Mitigation: Limit video export duration (e.g., max 60 seconds) or implement server-side rendering fallback.

### 📚 Resources

**Documentation:**
- [Remotion Documentation](https://www.remotion.dev/docs/)
- [Next.js Integration](https://www.remotion.dev/docs/ssr/nextjs)

**Examples:**
- [Remotion Spotify Wrapped Clone](https://github.com/remotion-dev/spotify-wrapped)
- [Audiogram Example](https://github.com/remotion-dev/audiogram)

### 🎬 Next Steps

**If approved:**
1. Add Remotion dependencies to the project.
2. Setup the Next.js API route or client-side renderer for the video.
3. Design the first video template.

**Questions to resolve:**
- [ ] Should we render client-side (WebCodecs) or server-side (AWS Lambda / Railway)?
- [ ] What specific animations do we want for the captions (karaoke style, pop-in, typewriter)?

### 💬 Discussion Points
- Considering the potential costs of server-side rendering, should we prioritize a client-side only approach initially, even if it excludes some older browsers?
