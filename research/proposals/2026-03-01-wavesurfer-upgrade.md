## Feature Proposal: WaveSurfer.js Upgrade for AudioHighlights

**User Story:**
As a user editing large podcast audio files, I want to clearly visualize the waveform with zooming capabilities and highlight regions so that I can easily navigate and review the generated clips.

**Current Workaround:**
The application currently uses a custom Canvas implementation (`src/components/audio/waveform.tsx`) to draw the audio waveform. This approach has several significant drawbacks:
- It requires decoding the entire audio file into memory, which is resource-intensive and prone to crashes on large files.
- It lacks built-in support for zooming into specific sections of the timeline.
- Managing overlay regions (highlights) over the canvas requires manual coordinate calculations that are fragile during resizing.

**Proposed Solution:**
Migrate the `Waveform` component to use `wavesurfer.js` along with its `RegionsPlugin`.
- `wavesurfer.js` provides robust out-of-the-box support for generating waveforms efficiently, handling playback synchronization, and responsive resizing.
- The `RegionsPlugin` directly maps our `GeneratedHighlight` objects onto the waveform, eliminating manual bounding box math.
- We can leverage the built-in `zoom` method to allow users to zoom into the waveform for precise timeline inspection.

**Success Metrics:**
- Waveform rendering time on 1hr+ audio files: reduced by avoiding full memory decode where possible.
- User engagement: Increased usage of timeline navigation due to the addition of zoom controls.
- Code complexity: Removal of custom canvas drawing logic (~150 lines of complex React/Canvas code).

**Implementation Effort:** Medium. The integration requires replacing the `Waveform` component and ensuring event listeners (seek, duration change) map correctly between `AudioPlayer` and `wavesurfer.js`.

**Priority:** High based on the need to improve performance and stability when handling long-form audio files which are the primary use case for this application.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** `wavesurfer.js` (v7.x)
- **Maturity:** Stable
- **Adoption:** Widely used in audio applications, trusted community standard.
- **Community:** >10k GitHub stars, highly active maintenance.
- **License:** BSD-3-Clause (Compatible with MIT).
- **Bundle size:** Moderate, but justified by replacing complex custom logic and providing essential features (zoom, regions).

**Competitive Analysis:**
- Competitors like Descript and Riverside all feature zoomable, interactive waveforms that are critical for professional audio editing UX. The current static canvas falls short of this standard.

### 🧪 Proof of Concept

**Implementation:**
A functional proof of concept was built at `research/pocs/wavesurfer/Waveform.tsx`. It demonstrates:
- Initialization of `wavesurfer.js` and `RegionsPlugin`.
- Mapping of mock highlights to colored regions.
- A functional zoom slider bound to the `ws.zoom()` API.

**Demo:**
The POC successfully renders an interactive waveform with draggable zoom and colored highlight overlays.

### ⚖️ Trade-offs

**Pros:**
- ✅ Provides essential zooming feature out-of-the-box.
- ✅ Handles complex region rendering and event handling automatically.
- ✅ Simplifies React component logic by delegating canvas management to the library.

**Cons:**
- ❌ Adds a new dependency to the bundle.
- ❌ Requires syncing state between the existing `AudioPlayer` component and the `WaveSurfer` instance, which may introduce minor race conditions if not handled carefully.

### 🎬 Next Steps

**If approved:**
1. Refactor `src/components/audio/waveform.tsx` to use the new implementation pattern shown in the POC.
2. Integrate the existing `highlights` prop to dynamically generate Regions.
3. Add UI controls for zooming directly into the Player or Waveform component.
4. Test performance on large files (>1 hour) to ensure stability.