## 🔬 Researcher: Virtualized Transcript Viewer

### 🎯 Executive Summary
Replace the current manual "chunked rendering" strategy in `TranscriptViewer` with a robust virtualization library (`react-virtuoso`). This will solve performance bottlenecks when rendering long episodes (4h+), reduce memory usage, and simplify the codebase by removing complex manual DOM management.

### 💡 Problem Statement
**Current situation:**
The application uses a custom "chunking" strategy (batches of 50 segments) to mitigate React rendering performance. However, for a 4-hour podcast (~10,000 segments), this still results in 10,000 DOM nodes being present in the document.

**User impact:**
- **Sluggish Scrolling:** The browser struggles to layout/paint thousands of flexbox items.
- **High Memory:** Keeping all segments in DOM consumes significant RAM.
- **Janky Playback:** Auto-scrolling logic relies on `scrollIntoView` which can be jerky with large layouts.

**Example scenario:**
A user uploads a 3-hour Joe Rogan episode. The transcript view takes several seconds to load, and scrolling feels "heavy" on a mid-range laptop.

### 🚀 Proposed Solution
**What:**
Implement `react-virtuoso` to handle the transcript list.

**How it works:**
- The library only renders the items currently visible in the viewport (plus a small overscan buffer).
- For 10,000 segments, only ~30 are in the DOM at any time.
- Auto-scrolling is handled by `virtuoso.scrollToIndex({ index: activeSegmentIndex })`.

**Why this approach:**
- **Performance:** O(1) DOM nodes vs O(N).
- **Simplicity:** Removes manual chunking logic (`TranscriptChunk`).
- **Features:** Built-in "stick to bottom", "scroll to index", and dynamic height support.

### 📊 Research Findings

**Technology Analysis:**
- **Library:** `react-virtuoso`
- **Maturity:** Stable, widely used.
- **Bundle size:** ~5kB (gzipped).
- **License:** MIT.

**Competitive Analysis:**
- Most professional transcription tools (Otter.ai, Descript) use virtualization for long texts.

### 🧪 Proof of Concept

**Implementation:**
A POC was created at `src/app/research-poc/page.tsx` and `src/components/transcription/virtualized-transcript-viewer-poc.tsx`.
It renders 10,000 dummy segments using `VirtualizedTranscriptViewerPOC`.

**Demo:**
![POC Screenshot](/research/virtualization-poc.png)

**Performance:**
- **Rendering:** Instant (vs noticeable delay with full render).
- **Scrolling:** 60fps smooth scrolling.
- **Playback:** Auto-scroll keeps active segment centered smoothly.

### 📈 Value Proposition

**Benefits:**
- ✅ **Performance:** Handle infinite length transcripts without lag.
- ✅ **Mobile Experience:** Critical for low-memory mobile devices.
- ✅ **Code Quality:** Delete custom chunking logic.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massive performance gain.
- ✅ Simplified code.

**Cons:**
- ❌ **Search (Cmd+F):** Native browser search (Cmd+F) won't work on non-rendered items. We must rely on our custom Search bar (which we already have).
- ❌ **Complexity:** Need to handle "Search Results View" (which is a different list).

### 🛠️ Implementation Plan

**Phase 1: Foundation** (1 day)
- [ ] Install `react-virtuoso`.
- [ ] Create `src/components/transcription/virtualized-transcript-viewer.tsx`.

**Phase 2: Integration** (1 day)
- [ ] Replace `TranscriptViewer` internal list with `Virtuoso`.
- [ ] Handle "Search Mode" (swap Virtuoso for a regular map or a filtered Virtuoso list).
- [ ] Wire up `scrollToIndex` for playback.

**Total estimated effort:** 2 developer-days.

**Dependencies:**
- `react-virtuoso`

### 🎬 Next Steps

**If approved:**
1. Install `react-virtuoso` (already installed for POC).
2. Refactor `TranscriptViewer`.
3. Verify accessibility and search functionality.
