## 🔬 Researcher: Client-Side ZIP Export for Highlights

### 🎯 Executive Summary
Proposing the integration of `jszip` to allow users to export all artifacts of a highlight (audio/video clip, SRT/VTT subtitles, and Markdown transcripts) packaged into a single ZIP file downloaded entirely on the client side. This improves UX by eliminating repetitive downloads for each individual artifact.

### 💡 Problem Statement
**Current situation:**
Currently, users can generate multiple clips and formats (SRT, VTT, Markdown), but they must manually click to download each file type individually for each highlight.

**User impact:**
Users generating, for instance, 5 highlights and needing both the video and the subtitles will need to perform 10 individual download clicks, leading to a tedious and error-prone workflow.

**Example scenario:**
A podcast editor generates 5 "Mix Mode" segments with their SRT files. They have to click the download button 10 times and manually organize the files into folders locally.

### 🚀 Proposed Solution
**What:**
Add a "Download as ZIP" option using the `jszip` library to bundle all related files (media and text) into a single `.zip` file for each highlight, or a bulk ZIP containing all highlights.

**How it works:**
The client-side React application will take the stored `Blob` objects for the media files and the string content for the transcripts/subtitles. It will use `jszip` to construct a file hierarchy in-memory and then use `file-saver` or native anchor tag downloads to save the `Blob` to the user's machine.

**Why this approach:**
Doing this entirely on the client side respects privacy and zero-cost constraints. We already have all the data in memory/IndexedDB, so a server round-trip for zipping is unnecessary overhead.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** JSZip (v3.10.1)
- **Maturity:** Stable, widely used in production
- **Adoption:** 13k+ GitHub Stars, heavily relied upon in the frontend ecosystem
- **Community:** Highly active, millions of weekly npm downloads
- **License:** MIT or GPLv3
- **Bundle size:** ~25KB minified and gzipped. Acceptable for the value it adds.

**Competitive Analysis:**
- Many modern web-based audio/video editors (like Descript or Riverside) offer "Export Project" features that bundle assets into ZIP files to simplify file management.

**Best Practices:**
- Generate the ZIP asynchronously to prevent main-thread blocking, particularly important when compressing multiple large media files.

### 🧪 Proof of Concept

**Implementation:**
```javascript
// See research/pocs/zip-export-poc.js
const JSZip = require('jszip');
const zip = new JSZip();

// 1. Add Text File (Markdown)
zip.file("highlight_info.md", markdownContent);

// 2. Add Binary File (Audio Blob)
zip.file("clip.mp3", audioBlob);

// 3. Generate ZIP blob
const content = await zip.generateAsync({ type: "blob" });
// Download content...
```

**Demo:**
The POC successfully generated a ZIP archive containing a text file and mock binary data using `jszip` in less than a second.

### 📈 Value Proposition

**Benefits:**
- ✅ Massively reduces click fatigue for users exporting multiple highlights.
- ✅ Ensures related assets (video + matching SRT) are kept together automatically.
- ✅ Zero server infrastructure cost since zipping is handled locally.

**User stories:**
- As a podcast editor, I can download a highlight as a ZIP so that I have the audio clip and its SRT file bundled together without manual organizing.

### ⚖️ Trade-offs

**Pros:**
- ✅ Simple API that works with existing Blobs and Strings.
- ✅ Client-side processing respects privacy and doesn't load the server.

**Cons:**
- ❌ Adds ~25KB to the client bundle size.
- ❌ Compressing very large audio files (hundreds of MBs) *could* cause memory pressure on low-end devices. (Mitigated by only zipping highlights, which are short clips).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Server-side ZIP | Offloads processing | High bandwidth costs, slower UX | Not chosen because of Vercel/Railway limits |
| Native File System Access API | Can write directly to disk | Limited browser support | Not chosen because JSZip is universally supported |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 day)
- [ ] Add `jszip` to dependencies
- [ ] Create utility functions in `src/lib/export.ts` to convert highlights to ZIP

**Phase 2: Core Feature** (estimated: 1 day)
- [ ] Add "Export as ZIP" button to the Highlight Card component
- [ ] Add "Export All Highlights" button to the main dashboard

**Phase 3: Polish & Testing** (estimated: 1 day)
- [ ] Add visual loading state during ZIP generation
- [ ] Test memory usage with 10+ highlights

**Total estimated effort:** 3 developer-days

**Dependencies:**
- `jszip`

**Risks:**
- ⚠️ High memory usage on mobile devices when zipping. - Mitigation: Provide a fallback or warning for large projects.

### 📚 Resources

**Documentation:**
- [JSZip Official Docs](https://stuk.github.io/jszip/)

### 🎬 Next Steps

**If approved:**
1. Install `jszip` into production dependencies.
2. Update `src/lib/export.ts` with ZIP logic.
3. Integrate UI changes.

### 💬 Discussion Points
- Should we provide compression, or just use JSZip in "STORE" mode (no compression) since MP3/MP4 files are already compressed? This would save CPU time.
