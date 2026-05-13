## 🔬 Researcher: Client-Side Video & Audio Cutting (WASM)

### 🎯 Executive Summary
Replace the current server-side FFmpeg microservice (running on Railway) with a **client-side WebAssembly implementation using `@ffmpeg/ffmpeg`**. This eliminates the need for server infrastructure for media editing, significantly reducing operational costs and ensuring complete user privacy since media files never leave the browser.

### 💡 Problem Statement
**Current situation:**
The application currently relies on a separate FFmpeg microservice (deployed on Railway) to cut media files based on generated highlights. The frontend sends the media and a cut list to the backend.

**User impact:**
- **Upload/Download Latency:** Users must wait for large media files (up to 500MB) to be uploaded to the backend and then wait for the cut files to be downloaded.
- **Cost:** Hosting a continuous FFmpeg service on Railway incurs monthly computing costs, which scale linearly with user traffic.
- **Privacy:** User media files must be transmitted over the internet to our servers.

**Example scenario:**
A user wants to export a 1-minute viral clip from a 2-hour, 500MB video file. Currently, the user's browser must upload the video to the backend, wait for processing, and then download the 1-minute result.

### 🚀 Proposed Solution
**What:**
Implement client-side media cutting using WebAssembly via the `@ffmpeg/ffmpeg` library directly in the user's browser.

**How it works:**
1. The browser downloads the FFmpeg WebAssembly core (`ffmpeg-core.wasm`) once and caches it.
2. When the user requests a clip/highlight, the original media file (already in memory or on the local filesystem) is processed locally using `-c copy` for near-instant stream copying without re-encoding.
3. The resulting file is generated entirely locally and saved directly to the user's device.

**Why this approach:**
- **Zero Latency:** No file upload or download required for cutting. Stream copying (`-c copy`) via WASM is extremely fast.
- **Zero Server Cost:** Removes the need for the FFmpeg microservice on Railway.
- **Privacy First:** The media file never leaves the user's local machine.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `@ffmpeg/ffmpeg` (v0.12+) and `@ffmpeg/core`
- **Maturity:** Stable, widely used in modern web apps (e.g., WhatsApp Web for video conversion).
- **Adoption:** High adoption for browser-based media editing.
- **Community:** Very active GitHub repository.
- **License:** MIT
- **Bundle size:** `ffmpeg-core.wasm` is around ~20-30MB, but can be loaded dynamically and cached.

**Best Practices:**
- Use `-c copy` (stream copy) whenever possible to avoid CPU-intensive re-encoding. WebAssembly does not have hardware acceleration, so full re-encoding is extremely slow in the browser.
- Run FFmpeg commands inside a Web Worker to prevent blocking the main UI thread during processing.

### 🧪 Proof of Concept

**Implementation:**
A successful Proof of Concept was built using Node.js with `ffmpeg-static` to simulate the raw performance of a local FFmpeg execution stream-copying an MP3 file. The principles directly map to the `@ffmpeg/ffmpeg` WASM library.

```javascript
ffmpeg(inputAudio)
  .setStartTime(1)
  .setDuration(3)
  .outputOptions('-c copy') // stream copy (fast, no re-encoding)
  .save(outputAudio);
```

**Performance:**
- **Cut Time (3-second clip from 10-second audio):** ~8.38ms average using `-c copy`.
- **Impact:** By avoiding re-encoding, local extraction is practically instant. The primary bottleneck will be loading the WASM binary into the browser memory on the first run, rather than the processing itself.

### 📈 Value Proposition

**Benefits:**
- ✅ **Cost Elimination:** Discard the Railway FFmpeg microservice entirely.
- ✅ **Faster Turnaround:** Eliminate the time required to upload 500MB files to the server.
- ✅ **Privacy:** Media remains entirely on the client's device.

**User stories:**
- As a user, I can instantly download my generated highlights without waiting for cloud processing.
- As an administrator, my infrastructure costs are reduced since I no longer pay for FFmpeg compute resources.

### ⚖️ Trade-offs

**Pros:**
- ✅ Massively reduced infrastructure costs.
- ✅ Instant file extraction (no upload/download wait).
- ✅ Enhanced privacy.

**Cons:**
- ❌ **Initial WASM Load:** Users must download the ~30MB WebAssembly binary on first use.
- ❌ **Browser Memory:** Processing very large 4K files entirely in the browser might hit RAM limitations on low-end devices.
- ❌ **Browser Compatibility:** Requires `SharedArrayBuffer` support, which necessitates strict Cross-Origin Isolation headers (`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| **Serverless FFmpeg (AWS Lambda)** | Scales well to zero. | High cold start times, difficult to compile FFmpeg within Lambda limits. | Not chosen because it still requires file uploads and incurs costs. |
| **Keep current microservice** | Works well, handles large files reliably. | Costs money constantly, requires file uploads. | Replace in favor of WASM. |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 2 days)
- [ ] Configure `next.config.ts` to output correct Cross-Origin headers for `SharedArrayBuffer` support.
- [ ] Implement a reusable hook/service (`useFFmpeg`) that loads the WASM core lazily and manages state.

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Implement the cutting logic using `-c copy` via the WASM instance.
- [ ] Read the local file using `fetchFile` and write the extracted segments out.

**Phase 3: Polish & Testing** (estimated: 1 day)
- [ ] Add progress indicators for the initial WASM download.
- [ ] Remove all backend FFmpeg microservice API calls and delete the `ffmpeg-service` folder.

**Total estimated effort:** 5 developer-days

**Dependencies:**
- `@ffmpeg/ffmpeg`
- `@ffmpeg/util`
- `@ffmpeg/core`

**Risks:**
- ⚠️ **Cross-Origin Headers Blocking External Assets:** Implementing `COEP: require-corp` can break external images or scripts. - **Mitigation:** Carefully test all third-party integrations (like Google Fonts or Analytics) and configure CORS properly.
- ⚠️ **RAM Limits on Mobile:** - **Mitigation:** Ensure we stream chunks if possible, though `@ffmpeg/ffmpeg` usually requires the full file in memory.

### 📚 Resources

**Documentation:**
- [FFmpeg WASM Official Docs](https://ffmpegwasm.netlify.app/)
- [Stream Copying with FFmpeg](https://ffmpeg.org/ffmpeg.html#Stream-copy)

### 🎬 Next Steps

**If approved:**
1. Create a test branch to verify Next.js compatibility with `Cross-Origin-Embedder-Policy`.
2. Implement a small client-side export button on a single highlight to test performance.
3. Completely phase out the Railway microservice.

### 💬 Discussion Points
- Should we provide a fallback to the server if the user's browser does not support `SharedArrayBuffer`?
- How should we handle the UI UX during the initial 30MB WASM download?