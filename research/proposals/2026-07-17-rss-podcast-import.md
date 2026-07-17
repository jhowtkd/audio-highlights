## 🔬 Researcher: RSS Podcast Feed Import

### 🎯 Executive Summary
Enable users to directly import podcast episodes by pasting an RSS feed URL, completely eliminating the need to manually download and upload large audio files.

### 💡 Problem Statement
**Current situation:**
Users currently have to download a podcast episode to their local machine and then upload it to AudioHighlights. For large, hour-long files, this is a tedious, bandwidth-intensive two-step process that causes significant friction.

**User impact:**
Every user looking to generate highlights from public podcasts (a primary use case for this application) is forced to perform manual file management. This is time-consuming and often deters use on mobile devices or slower connections.

**Example scenario:**
A user wants to create clips from the latest 2-hour Lex Fridman podcast. They have to find a third-party download site, download a 100MB+ MP3 to their hard drive, and then drag it into the AudioHighlights interface and wait for it to upload to the server.

### 🚀 Proposed Solution
**What:**
Add an "Import from RSS" option to the upload screen where users can paste a podcast RSS feed URL. The application parses the feed, displays a list of recent episodes, and allows the user to select one for direct server-side transcription.

**How it works:**
1. A new UI component allows entering an RSS URL alongside the existing drag-and-drop file upload.
2. An API route (e.g., `/api/rss`) uses the `rss-parser` library to fetch and parse the feed, returning episode metadata (title, date, audio URL).
3. The frontend displays the episodes.
4. When an episode is selected, its audio URL is passed directly to the `ffmpeg-service` or a new download/transcribe endpoint, bypassing the client for the actual audio transfer.

**Why this approach:**
It leverages standard podcasting infrastructure. `rss-parser` is lightweight, robust, and well-maintained. Direct server-to-server transfer (from the podcast host to our processing server) is orders of magnitude faster and more reliable than routing large files through the user's browser.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `rss-parser` (v3)
- **Maturity:** Stable
- **Adoption:** Over 1.5M weekly downloads on npm.
- **Community:** Highly active, minimal open issues for core parsing.
- **License:** MIT
- **Bundle size:** Minimal (server-side only dependency).

**Competitive Analysis:**
- OpusClip, Munch, and Headliner all offer direct import via URL (YouTube or RSS), removing the need for manual file handling. It is considered a baseline feature for modern audio/video clipping tools.

**Best Practices:**
Server-side fetching prevents CORS issues that would occur if the browser attempted to fetch the RSS feed directly.

### 🧪 Proof of Concept

**Implementation:**
```javascript
// A simple Node script demonstrating RSS parsing (see research/pocs/rss-podcast-import.js)
const Parser = require('rss-parser');
const parser = new Parser();

async function run() {
  const feed = await parser.parseURL('https://feeds.simplecast.com/qm_9xx0g');
  console.log("Podcast Title:", feed.title);
  console.log("Latest Episode:", feed.items[0].title);
  console.log("Audio URL:", feed.items[0].enclosure.url);
}
run();
```

**Demo:**
Running the POC successfully outputs the latest episode of "Crime Junkie" and the direct MP3 URL ready for processing.

**Performance:**
- Before: Download (local) + Upload (to server) = ~2-5 minutes for a 100MB file.
- After: Fetching RSS takes < 1s. Server-to-server download/stream is near instantaneous on cloud infrastructure.
- Impact: Massive reduction in time-to-value.

### 📈 Value Proposition

**Benefits:**
- ✅ **Eliminates Manual Labor:** No more downloading and re-uploading files.
- ✅ **Saves Bandwidth:** Users don't use their personal internet connection to transfer large files.
- ✅ **Enables Mobile Usage:** Makes it feasible to start a project from a mobile device where file management is cumbersome.

**User stories:**
- As a content creator, I can paste a podcast URL to instantly start generating clips without filling up my hard drive.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massively improved UX for the primary use case.
- ✅ Very low implementation complexity (parsing XML is a solved problem).

**Cons:**
- ❌ Requires a new backend endpoint to handle the fetching to bypass CORS.
- ❌ We must handle edge cases where RSS feeds are malformed or missing the `enclosure` tag (though rare for standard podcasts).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| YouTube Import | Huge source of content | Technically complex (requires ytdl-core, often breaks due to YT changes) | Not chosen for this iteration. RSS is more stable. |
| Spotify API Integration | Nice UI/UX | Requires OAuth setup, complex rate limits | Overkill just to get an MP3 URL. |

### 🛠️ Implementation Plan

**Phase 1: Backend Parsing** (estimated: 1 day)
- [ ] Add `rss-parser` dependency.
- [ ] Create `/api/rss/parse` endpoint to accept a URL, parse it, and return episode data.

**Phase 2: UI Integration** (estimated: 1.5 days)
- [ ] Add "Import via URL" tab to the Upload screen.
- [ ] Build a simple list component to display parsed episodes.
- [ ] Integrate selection to trigger the existing project creation flow.

**Phase 3: Server-side Audio Fetching** (estimated: 1.5 days)
- [ ] Modify the transcription/upload flow to accept a direct URL instead of a File object.
- [ ] Implement server-side downloading of the audio URL before passing it to Whisper/FFmpeg.

**Total estimated effort:** 4 developer-days

**Dependencies:**
- `rss-parser`

**Risks:**
- ⚠️ CORS issues on the audio file itself during transcription/playback if we rely entirely on the remote URL. - Mitigation: The server should download and cache the file locally (or to our storage) just like a normal upload, ensuring consistent access.

### 📚 Resources

**Documentation:**
- [rss-parser GitHub](https://github.com/rbren/rss-parser)

### 🎬 Next Steps

**If approved:**
1. Install `rss-parser`.
2. Build the `/api/rss/parse` endpoint.
3. Design the "Import URL" tab on the frontend.

### 💬 Discussion Points
- Should we store the downloaded podcast MP3s in a permanent object store (S3) or treat them as temporary files during the session, similar to how we handle uploads now?
