## 🔬 Researcher: Subtitle Burn-In via FFmpeg

### 🎯 Executive Summary
I propose adding the ability to burn subtitles (hardsubbing) directly into video highlights using FFmpeg. This will allow users to download clips that are instantly ready for social media platforms like Instagram and TikTok, which heavily favor content with baked-in captions.

### 💡 Problem Statement
**Current situation:**
Currently, users can generate a video clip and export a separate `.srt` or `.vtt` file.

**User impact:**
To post on social media with subtitles, users must import the video and subtitle file into a third-party editor (like Premiere or CapCut) to burn them in. This breaks the seamless "one-click export" workflow.

**Example scenario:**
A creator wants to share a 30-second highlight to Instagram Reels. They generate the clip and the VTT. Since Instagram doesn't support uploading separate VTT files for Reels, they have to use external software to combine them.

### 🚀 Proposed Solution
**What:**
Add a "Burn Subtitles" option to the export flow. When selected, the `ffmpeg-service` will apply the `-vf subtitles` filter to bake the text into the video track.

**How it works:**
1.  Frontend sends the generated VTT content along with the cut request to the `ffmpeg-service`.
2.  The service writes the VTT to a temporary file.
3.  The service runs FFmpeg with `-vf subtitles=temp.vtt` and `-c:v libx264` (re-encoding is required when applying filters).

**Why this approach:**
It leverages our existing FFmpeg microservice infrastructure and provides the most requested feature for social media workflows without requiring client-side WebAssembly video encoding.

### 📊 Research Findings

**Technology Analysis:**
-   **Library/Framework:** `ffmpeg-static` and `fluent-ffmpeg` in Node.js.
-   **Maturity:** Stable.
-   **Constraints:** The `subtitles` filter *requires* FFmpeg to be compiled with `--enable-libass`. Fortunately, `ffmpeg-static` includes this out of the box. Secondly, applying visual filters means we *cannot* use stream copying (`-c copy`) for the video track; it must be re-encoded (e.g., using `libx264`), which will increase processing time compared to simple cuts.

**Competitive Analysis:**
-   **OpusClip / Munch:** Offer baked-in, highly stylized subtitles.
-   **Descript:** Burns subtitles into exports.

**Best Practices:**
-   Ensure VTT files are properly formatted (UTF-8).
-   Offer customization (font size, color) in the future by generating `.ass` files instead of `.vtt`.

### 🧪 Proof of Concept

**Implementation:**
```javascript
// See research/pocs/subtitle-burn-in.js
```

**Performance:**
-   Before (Stream Copy Cut): ~1-2 seconds.
-   After (Re-encoding with Subtitles): ~10-15 seconds for a 60s clip, depending on server CPU.
-   Impact: Slower export, but saves the user minutes of manual work.

### 📈 Value Proposition

**Benefits:**
-   ✅ True "one-click" workflow for social media.
-   ✅ Increases shareability of generated clips.
-   ✅ Keeps users inside our ecosystem.

**User stories:**
-   As a content creator, I can download a video with hardcoded subtitles so that I can immediately post it to TikTok without opening an editor.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Huge workflow improvement for users.
-   ✅ Uses existing FFmpeg setup.

**Cons:**
-   ❌ Increases server load and export time due to re-encoding (`-c:v libx264`).
-   ❌ Loss of "instant" export feel for hardsubbed clips.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Client-side rendering (Canvas) | No server cost | Very slow, complex to implement | Not chosen because FFmpeg is more robust |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 day)
-   [ ] Update `ffmpeg-service` to accept VTT content in the POST request.
-   [ ] Write VTT content to a temp file.

**Phase 2: Core Feature** (estimated: 1 day)
-   [ ] Update FFmpeg arguments in the service to conditionally apply `-vf subtitles` and switch from `-c copy` to `-c:v libx264`.

**Phase 3: Polish & Testing** (estimated: 1 day)
-   [ ] Add "Burn Subtitles" toggle to the frontend export UI.
-   [ ] Handle longer timeout expectations on the client.

**Total estimated effort:** 3 developer-days

### 📚 Resources

**Documentation:**
-   [FFmpeg Subtitles Filter](https://ffmpeg.org/ffmpeg-filters.html#subtitles-1)
