## 🔬 Researcher: Subtitle Burn-in (Hardsubbing) using FFmpeg

### 🎯 Executive Summary
Implement server-side subtitle burn-in (hardsubbing) to allow users to generate videos with embedded text. This will leverage FFmpeg's `subtitles` filter within our existing microservice.

### 💡 Problem Statement
**Current situation:**
We generate VTT/SRT files and provide video clips, but users cannot export a final video with the text baked into the picture.

**User impact:**
Content creators on platforms like TikTok or Instagram Reels require hardcoded text, as standalone caption files are often poorly supported.

**Example scenario:**
A user generates a viral clip and wants to download a single MP4 file ready for social media posting, including styled captions.

### 🚀 Proposed Solution
**What:**
Add a new endpoint `/burn-subtitles` to the `ffmpeg-service` microservice that takes a video file and a subtitle file (VTT/SRT), and returns a video with the subtitles burned in.

**How it works:**
The service will use FFmpeg with the `-vf subtitles=subs.vtt` filter. This requires re-encoding the video track (`-c:v libx264`).

**Why this approach:**
Server-side processing prevents heavy CPU usage on the client and ensures maximum compatibility of the final output file across platforms.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `ffmpeg-static` (Node.js wrapper) / FFmpeg
- **Maturity:** Highly stable
- **Adoption:** Industry standard for media processing
- **Community:** Massive

**Important Consideration:**
The `ffmpeg-static` package provides a binary compiled with `--enable-libass`, which is strictly required for the `subtitles` filter to process VTT or SRT files successfully.
Furthermore, applying any media filters (such as `-vf subtitles`) strictly requires re-encoding the respective track (e.g., `-c:v libx264`) and cannot be combined with fast stream copying (`-c copy`).

### 📈 Value Proposition

**Benefits:**
- ✅ Social-media ready exports
- ✅ Increased user retention
- ✅ Highly requested feature

**User stories:**
- As a content creator, I can download a video with hardcoded subtitles so that I can upload it directly to TikTok without extra editing steps.

### ⚖️ Trade-offs

**Pros:**
- ✅ Leverages existing infrastructure
- ✅ High quality output

**Cons:**
- ❌ Re-encoding is significantly slower and more CPU intensive than stream copying (`-c copy`).
- ❌ Higher server costs due to compute.

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 day)
- [ ] Add `/burn-subtitles` endpoint to `ffmpeg-service`.
- [ ] Implement robust file handling for both video and subtitle inputs.

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Construct the FFmpeg command using the `-vf subtitles` filter and `-c:v libx264`.
- [ ] Ensure `libass` compatibility and handle potential errors.

### 🎬 Next Steps

**If approved:**
1. Develop the endpoint in the microservice.
2. Integrate a button in the frontend to trigger the burn-in process.

### 💬 Discussion Points
- How do we handle the increased CPU load on our servers?
- Should we expose styling options (font, size, color) to the user?
