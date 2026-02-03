## 🔬 Researcher: Virtualized Transcript Viewer

### 🎯 Executive Summary
Implement **virtualized list rendering** for the transcript viewer using `react-virtuoso`. This addresses critical performance bottlenecks caused by rendering thousands of DOM nodes for long transcripts, ensuring 60fps scrolling and instant playback syncing regardless of transcript length.

### 💡 Problem Statement
**Current situation:**
The `TranscriptViewer` component currently uses a primitive "chunking" strategy (batches of 50 segments) but ultimately renders **all segments** into the DOM.
- For a 1-hour podcast (~600 segments), this is manageable.
- For a 3-hour recording (~2000+ segments), the DOM size explodes (10k+ nodes).

**User impact:**
- **Jank:** Scrolling becomes sluggish on lower-end devices.
- **Playback Lag:** Auto-scrolling to the active segment during playback causes layout thrashing.
- **Memory:** High memory usage due to excessive DOM nodes.

**Example scenario:**
A user loads a 3-hour meeting recording. The initial render takes 2-3 seconds. When they play the audio, the "auto-scroll" feature stutters, and clicking a segment has a noticeable delay.

### 🚀 Proposed Solution
**What:**
Replace the manual `.map()` rendering in `TranscriptViewer` with `react-virtuoso`.

**How it works:**
1.  **Windowing:** Only render the segments currently visible in the viewport (plus a small buffer).
2.  **Dynamic Heights:** `react-virtuoso` automatically measures and handles variable text lengths.
3.  **Auto-Scroll:** Use the `virtuosoRef.current.scrollIntoView({ index })` API to smoothly sync with playback.

**Why this approach:**
-   **Performance:** Constant O(1) DOM nodes regardless of transcript length.
-   **Simplicity:** Removes complex manual chunking logic.
-   **Features:** Built-in "stick to bottom", "scroll to index", and "follow output" behaviors.

### 📊 Research Findings

**Technology Analysis:**
-   **Library:** `react-virtuoso`
-   **Maturity:** Mature, widely used (React 18/19 compatible).
-   **Adoption:** 5k+ stars, heavily maintained.
-   **Bundle size:** ~5kb (minified + gzipped).

**Competitive Analysis:**
-   **YouTube:** Uses virtualization for live chat and comment lists.
-   **Descript:** Virtualizes the script view to handle multi-hour edits.

### 🧪 Proof of Concept

**Implementation:**
A POC was created in `research/pocs/virtuoso-poc.tsx`.
It demonstrates:
-   Rendering 1000 variable-length segments.
-   Smooth auto-scrolling during playback simulation.
-   Instant seek to index.

**Demo:**
![Virtuoso POC](/research/virtuoso-poc.png)

**Performance (Observed in POC):**
-   **Before (Simulated):** 1000 items = ~3000 DOM nodes.
-   **After (Virtuoso):** 1000 items = ~20 DOM nodes (only visible ones).
-   **Impact:** 99% reduction in DOM nodes.

### 📈 Value Proposition

**Benefits:**
-   ✅ **Scalability:** Support transcripts of any length (even 10+ hours).
-   ✅ **Smoothness:** Butter-smooth scrolling and playback syncing.
-   ✅ **Mobile Friendly:** Critical for mobile browsers with limited memory.

**User stories:**
-   As a researcher analyzing a 4-hour interview, I want the interface to remain responsive so I can tag segments without lag.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Massive performance gain.
-   ✅ Simplifies code (removes manual chunking).

**Cons:**
-   ❌ **Search Ctrl+F:** Native browser `Ctrl+F` **will not work** for off-screen text.
    -   *Mitigation:* We already have a custom "Semantic Search" and filter feature. We should enhance our in-app search to highlight matches, which `react-virtuoso` supports via custom item rendering.

### 🛠️ Implementation Plan

**Phase 1: Foundation (estimated: 1 day)**
-   [ ] Install `react-virtuoso`.
-   [ ] Create a `VirtualizedTranscript` component.
-   [ ] Implement `activeSegmentIndex` auto-scrolling.

**Phase 2: Integration (estimated: 1 day)**
-   [ ] Replace the list in `TranscriptViewer`.
-   [ ] Wire up "Click to seek" handlers.
-   [ ] Verify "Search Highlighting" (pass search results to item renderer).

**Total estimated effort:** 2 developer-days

**Risks:**
-   ⚠️ **Search:** Users relying on native Ctrl+F might be confused. We must ensure our in-app search is prominent.

### 📚 Resources

**Documentation:**
-   [React Virtuoso](https://virtuoso.dev/)

### 🎬 Next Steps

**If approved:**
1.  Approve dependency.
2.  Refactor `TranscriptViewer`.
