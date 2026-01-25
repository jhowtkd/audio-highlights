## 2024-05-22 - Audio Visualization Research

**Research Topic:** Improving Audio Navigation and Visualization

**Finding:**
Current implementation (`src/components/audio/waveform.tsx`) uses a custom Canvas solution that:
- Decodes full audio file (memory intensive).
- Has fixed resolution (200 samples).
- Lacks zoom.

**Decision:**
Propose upgrading to `wavesurfer.js` to enable Zoom, Regions, and better performance handling (streaming/peaks).

**Learning:**
Custom canvas implementations for audio waveforms are hard to maintain and often miss critical features like zooming which users expect from professional tools.

**Resources:**
- https://wavesurfer.xyz/
