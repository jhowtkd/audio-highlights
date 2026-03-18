## 🔬 Researcher: Upgrade Custom Waveform to WaveSurfer.js

### 🎯 Executive Summary
Replace our custom canvas-based waveform implementation with `wavesurfer.js`. This will provide critical features like zooming, regions plugin for highlights, and better performance for large audio files without risking memory crashes.

### 💡 Problem Statement
**Current situation:**
Our custom canvas waveform decodes the entire audio file into memory and draws a fixed-resolution view. It lacks zoom capabilities and can freeze the browser on very long audio files.

**User impact:**
Users working with long podcasts (1hr+) cannot easily navigate to specific seconds because the waveform is too dense. Large files can crash the browser tab.

**Example scenario:**
A user uploads a 2-hour podcast. The waveform renders as a single dense block. Trying to click precisely at 1h 15m 32s is impossible without zooming.

### 🚀 Proposed Solution
**What:**
Migrate from `src/components/audio/waveform.tsx` (custom canvas) to `wavesurfer.js`.

**How it works:**
Integrate `wavesurfer.js` and its `RegionsPlugin` (from `wavesurfer.js/dist/plugins/regions.esm.js`). We will pass our `audioUrl` and initialize the waveform. We map our `highlights` to regions.

**Why this approach:**
`wavesurfer.js` is the industry standard for web audio visualization. It handles chunked decoding, zooming (`minPxPerSec`), and provides interactive regions out of the box, saving us from reinventing the wheel.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** wavesurfer.js (latest)
- **Maturity:** Stable
- **Adoption:** Wide industry use
- **Community:** 10k+ GitHub stars
- **License:** BSD-3-Clause
- **Bundle size:** ~50kb gzipped

**Competitive Analysis:**
Descript and Riverside both offer zoomable waveforms with draggable region markers for editing.

**Best Practices:**
Using a dedicated audio library for large files prevents Main Thread blocking.

### 🧪 Proof of Concept

**Implementation:**
```tsx
import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface WaveformProps {
    audioUrl: string;
}

export function Waveform({ audioUrl }: WaveformProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#cbd5e1',
            progressColor: '#3b82f6',
            url: audioUrl,
            minPxPerSec: 100, // Enables zooming
            cursorColor: '#ef4444',
            plugins: [RegionsPlugin.create()]
        });

        return () => wavesurfer.destroy();
    }, [audioUrl]);

    return <div ref={containerRef} />;
}
```
*POC located at `research/pocs/wavesurfer/Waveform.tsx`*

### 📈 Value Proposition

**Benefits:**
- ✅ Zoomable waveform for precise editing
- ✅ Reduced memory footprint for long files
- ✅ Interactive, draggable regions for highlights

**User stories:**
- As a podcast editor, I can zoom into the waveform so that I can make precise cuts at the exact millisecond.

### ⚖️ Trade-offs

**Pros:**
- ✅ Solves long-standing zoom request
- ✅ Better performance out of the box

**Cons:**
- ❌ Adds a new dependency to the bundle
- ❌ Requires rewriting our custom highlight tooltip logic to match wavesurfer's event system

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Custom Canvas Zoom | No new deps | Huge engineering effort, buggy | Not chosen |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 days)
- [ ] Install wavesurfer.js
- [ ] Create base wrapper component

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Integrate Regions plugin for highlights
- [ ] Sync with existing player state (currentTime, playbackRate)

**Phase 3: Polish & Testing** (estimated: 1 days)
- [ ] Add zoom controls UI
- [ ] Ensure accessible keyboard navigation is maintained

**Total estimated effort:** 4 developer-days

### 📚 Resources

**Documentation:**
- https://wavesurfer.xyz/

### 🎬 Next Steps

**If approved:**
1. Review POC
2. Schedule task for next sprint
