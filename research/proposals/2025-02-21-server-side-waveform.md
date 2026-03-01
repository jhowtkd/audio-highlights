## 🔬 Researcher: Server-Side Waveform Visualization

### 🎯 Executive Summary
Replace the current client-side waveform generation (which causes browser crashes on large files) with a **server-side peak generation service** and integrate **wavesurfer.js v7** for a high-performance, interactive editing experience.

### 💡 Problem Statement
**Current situation:**
The application uses a custom `Waveform` component that attempts to decode the entire audio file in the browser using `AudioContext.decodeAudioData`.
- **OOM Crashes:** For files longer than ~10-15 minutes, decoding raw PCM data consumes gigabytes of RAM, often crashing the browser tab.
- **Poor Interactivity:** The current component is static; it lacks zooming, seeking precision, and region selection.
- **Workaround Limitations:** A fallback exists to visualize "transcription segment density" instead of the actual audio waveform, but this is inaccurate and hides silence/noise details essential for editing.

**User impact:**
- **Editors:** Cannot visually identify silences or specific sounds in long podcasts.
- **General Users:** Experience tab crashes or sluggish performance with large uploads.

**Example scenario:**
A user uploads a 2-hour podcast (100MB MP3). The browser attempts to decode it into raw PCM (approx 1.2GB RAM). The tab freezes and crashes "Aw Snap". The user loses their progress.

### 🚀 Proposed Solution
**What:**
1.  **Backend:** Add a `/generate-waveform` endpoint to `ffmpeg-service` that streams the audio file through FFmpeg to extract amplitude peaks, returning a lightweight JSON array.
2.  **Frontend:** Replace the custom `Waveform` component with **wavesurfer.js v7**, initialized with the pre-computed peaks.
3.  **Feature:** Enable `RegionsPlugin` to visualize and adjust Highlights directly on the waveform.

**How it works:**
1.  **Ingestion:** When a file is uploaded, the server (or `ffmpeg-service`) processes it to generate a JSON file of peaks (e.g., 100 points per second).
2.  **Visualization:** The frontend fetches `peaks.json` (<1MB for 1 hour) and passes it to `wavesurfer.js`.
3.  **Playback:** `wavesurfer.js` uses the HTML5 Audio element (MediaElement backend) for playback, avoiding full file decoding.

**Why this approach:**
- **Zero OOM:** Browser never decodes the full file.
- **Instant Load:** Waveform renders immediately from JSON.
- **Professional UX:** Enables zoom, precise seeking, and region dragging (critical for "Highlights" adjustment).

### 📊 Research Findings

**Technology Analysis:**
- **Library:** `wavesurfer.js` (v7)
- **Maturity:** Stable, widely used standard.
- **Performance:** v7 is rewritten in TypeScript and optimized for performance.
- **Backend:** `ffmpeg` (already in use) is extremely efficient at stream processing.

**Competitive Analysis:**
- **Descript:** Uses server-generated waveforms for instant rendering of long files.
- **SoundCloud:** Uses pre-computed PNG/JSON waveforms.
- **Audacity/DAWs:** Always use peak files (.pk) to avoid re-reading raw audio.

### 🧪 Proof of Concept

**Implementation:**
A POC script (`research/pocs/server-waveform-poc.ts`) demonstrated the speed of server-side generation using `ffmpeg`.

```typescript
// Key logic from POC
const args = ['-i', input, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'];
const child = spawn('ffmpeg', args);
// Stream output and calculate max amplitude per window...
```

**Performance Results (M1 equivalent):**
- **Input:** 60-second sine wave MP3.
- **Generation Time:** ~100ms (600x realtime speed).
- **Output Size:** ~40KB JSON (100 peaks/sec).
- **Scalability:** A 1-hour podcast would take ~6 seconds to process and produce ~2.4MB JSON (compressible).

### 📈 Value Proposition

**Benefits:**
- ✅ **Stability:** Eliminates browser crashes on large files.
- ✅ **Precision:** Users can see exactly where silence/noise is.
- ✅ **Interactivity:** Enables "Drag to Resize" for highlights, improving clip quality.

**User stories:**
- As a **Podcaster**, I want to see the waveform of my 2-hour episode without crashing my browser.
- As an **Editor**, I want to zoom in to find the exact start/end of a sentence to adjust a highlight.

### ⚖️ Trade-offs

**Pros:**
- ✅ Solves the critical crash issue.
- ✅ enables advanced editing features (zoom, regions).
- ✅ Low server overhead (stream processing).

**Cons:**
- ❌ **Storage:** Need to store the generated `peaks.json` file (small, but non-zero).
- ❌ **Complexity:** Adds a new asynchronous step to the upload pipeline.

### 🛠️ Implementation Plan

**Phase 1: Backend Service** (1 day)
- [ ] Add `POST /waveform` to `ffmpeg-service`.
- [ ] Implement FFmpeg stream processing to output JSON peaks.

**Phase 2: Frontend Integration** (2 days)
- [ ] Install `wavesurfer.js`.
- [ ] Create `WaveformViewer` component to replace current `Waveform`.
- [ ] Integrate `RegionsPlugin` to display Highlight start/end times.

**Phase 3: Interaction & Polish** (1 day)
- [ ] Add Zoom slider.
- [ ] Sync playback with `TranscriptViewer`.
- [ ] Allow dragging regions to update Highlight timestamps.

**Total estimated effort:** 4 developer-days

**Dependencies:**
- `wavesurfer.js`
- `ffmpeg` (existing)

### 📚 Resources

**Documentation:**
- [wavesurfer.js v7 Docs](https://wavesurfer.xyz/docs/)
- [FFmpeg PCM Output](https://trac.ffmpeg.org/wiki/audio%20types)

### 🎬 Next Steps

**If approved:**
1. Update `ffmpeg-service` to include waveform generation.
2. Build the frontend component.
