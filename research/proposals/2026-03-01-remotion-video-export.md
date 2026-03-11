## 🔬 Researcher: Remotion for Advanced Video Export

### 🎯 Executive Summary
Proposing the integration of Remotion to enable advanced video exporting capabilities. This will allow us to generate polished video highlights with burned-in dynamic captions and custom backgrounds programmatically using React.

### 💡 Problem Statement
**Current situation:**
Currently, users can only export highlights as simple audio clips or unstyled video cuts using FFmpeg. There is no built-in way to generate the highly popular "social media style" clips with animated, burned-in captions and custom branding directly from our platform.

**User impact:**
Users creating content for TikTok, Instagram Reels, or YouTube Shorts have to export our raw clips and import them into another tool (like CapCut or Premiere) to add engaging captions and backgrounds, adding significant friction to their workflow.

**Example scenario:**
A podcaster uses our tool to find a great 60-second highlight. Instead of sharing it directly to Instagram, they must download the video, download the SRT file, open a separate video editor, sync the files, style the captions, and re-export the video before finally posting.

### 🚀 Proposed Solution
**What:**
Integrate Remotion, a framework for creating videos programmatically using React, to render polished, ready-to-share video highlights directly on our server.

**How it works:**
We will create a Remotion project containing React components that take the highlight data (audio URL, transcript segments, timing) and render a customized video player experience (e.g., dynamic text highlighting, progress bars, branded backgrounds). This Remotion composition will be bundled and rendered server-side using `@remotion/lambda` or a dedicated Node.js rendering worker when the user clicks "Export Video".

**Why this approach:**
Remotion allows us to leverage our existing React expertise to build complex video templates. Since our application already parses audio into timestamped transcript segments, we can easily pass this structured data as props to a Remotion composition to animate captions precisely in sync with the audio.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** Remotion (v4.x)
- **Maturity:** Stable, widely used in production
- **Adoption:** GitHub, Spotify, and many AI video generation startups
- **Community:** ~18k GitHub stars, active Discord, excellent documentation
- **License:** Remotion Company License (Free for individuals and small companies; requires a paid license for larger organizations - *needs verification based on our company size*)
- **Bundle size:** N/A for the main client bundle as rendering happens server-side. The player can be embedded if we want client-side preview.

**Competitive Analysis:**
- Opus Clip: Offers highly styled, AI-driven video generation with dynamic captions (Likely using a similar programmatic video approach).
- Veed.io: Web-based video editor with automatic captioning and styling.

**Best Practices:**
- Separate video templates into a standalone package or workspace.
- Use `@remotion/player` for client-side previews to let users tweak styles before rendering.
- Offload the heavy rendering process to AWS Lambda (`@remotion/lambda`) or a separate worker queue to avoid blocking the main API server.

### 🧪 Proof of Concept

**Implementation:**
```tsx
// See research/pocs/remotion-export/VideoExport.tsx for full implementation details
```

**Demo:**
N/A - See POC code.

**Performance:**
- Rendering videos is computationally intensive.
- Impact: Requires dedicated rendering infrastructure (e.g., AWS Lambda or background workers) to ensure the main application remains responsive.

### 📈 Value Proposition

**Benefits:**
- ✅ **Massive UX Improvement:** Users can get a final, platform-ready video directly from our tool, saving them 10-20 minutes per clip.
- ✅ **Differentiation:** Upgrades our tool from a "highlight finder" to a "content creation engine".
- ✅ **Monetization Potential:** Premium video templates or fast rendering queues can be offered as a paid tier.

**User stories:**
- As a content creator, I can export a highlight with burned-in captions so that I can immediately post it to TikTok without using a secondary video editor.

### ⚖️ Trade-offs

**Pros:**
- ✅ Leverages existing React knowledge; no need to learn complex video editing APIs or After Effects scripting.
- ✅ Highly customizable; we can build any UI we want for the captions.
- ✅ `@remotion/player` allows real-time previews in the browser before rendering.

**Cons:**
- ❌ **Infrastructure Complexity:** Requires setting up and maintaining scalable rendering infrastructure (Lambda or workers).
- ❌ **Cost:** Server-side video rendering is expensive in terms of compute resources.
- ❌ **Licensing:** We must carefully review the Remotion license terms to ensure compliance based on our business model and size.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Complex FFmpeg Filters (`drawtext`) | Free, no new infra needed if using existing FFmpeg service | Extremely difficult to style, hard to create complex animations (like word-by-word highlighting), poor DX | Not chosen because the developer experience and visual flexibility are too limited for modern social media templates. |
| Browser-side Canvas recording | Free server costs | Unreliable performance across devices, user cannot close tab while rendering, limited quality | Not chosen due to poor reliability and UX during long renders. |

### 🛠️ Implementation Plan

**Phase 1: Foundation & Templates** (estimated: 5 days)
- [ ] Set up a Remotion project within the monorepo (or as a separate service).
- [ ] Create basic React components for the video template (Audio, Subtitles, Background).
- [ ] Integrate `@remotion/player` in our frontend to allow users to preview the highlight with the template.

**Phase 2: Rendering Infrastructure** (estimated: 7 days)
- [ ] Evaluate and select the rendering strategy (`@remotion/lambda` vs. dedicated Node workers).
- [ ] Implement the backend API endpoint to trigger a render job, passing the highlight data as input props.
- [ ] Implement a polling or webhook mechanism to notify the client when the render is complete.

**Phase 3: Polish & Integration** (estimated: 4 days)
- [ ] Add customization options (font choice, colors, background image) in the frontend.
- [ ] Optimize the templates for different aspect ratios (9:16 for Reels, 16:9 for YouTube).
- [ ] End-to-end testing and performance tuning.

**Total estimated effort:** 16 developer-days

**Dependencies:**
- `remotion`
- `@remotion/player`
- `@remotion/lambda` (if chosen)

**Risks:**
- ⚠️ **Render Costs:** Video rendering can quickly become expensive. - Mitigation: Implement strict rate limits and consider caching rendered videos.
- ⚠️ **Licensing:** Potential legal issues if we violate the license. - Mitigation: Clear the license requirements with legal/management before proceeding.

### 📚 Resources

**Documentation:**
- [Remotion Official Docs](https://www.remotion.dev/docs/)
- [Remotion Subtitles Guide](https://www.remotion.dev/docs/subtitle)

**Examples:**
- [Remotion GitHub Repository](https://github.com/remotion-dev/remotion)

### 🎬 Next Steps

**If approved:**
1. Review and approve the Remotion license terms for our use case.
2. Initialize a basic Remotion workspace and build a static prototype of the target video style.
3. Design the architecture for the rendering queue.

**Questions to resolve:**
- [ ] Does our current company size and revenue allow us to use the free Remotion Company License, or do we need to purchase one?
- [ ] Should we use `@remotion/lambda` for ease of setup, or build our own rendering cluster on Railway to control costs?

### 💬 Discussion Points
- How much customization should we offer the user? (e.g., just colors, or full layout control?)
- Should video export be a premium-only feature due to rendering costs?
