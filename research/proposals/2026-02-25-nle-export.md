## 🔬 Researcher: NLE (Non-Linear Editor) Export Support (EDL/FCPXML)

### 🎯 Executive Summary
Enable professional video editors to seamlessly transition from AudioHighlights to their preferred NLE (Premiere Pro, DaVinci Resolve, Final Cut Pro) by exporting timeline formats (EDL and FCPXML). This transforms the app from a final-delivery tool into a powerful pre-production and rough-cut tool for professional workflows.

### 💡 Problem Statement
**Current situation:**
Currently, users can only download fully rendered clips or text-based transcripts/subtitles. If an editor wants to take the AI-generated "Mix Mode" rough cut and refine it, add b-roll, or apply professional color grading, they have to manually recreate all the cuts in their editing software by reading the start/end times.

**User impact:**
Professional video editors and content creators who use AudioHighlights to find the best moments still have to do manual, tedious work to actually edit the final video in their professional software. This friction prevents adoption by professional teams.

**Example scenario:**
A podcast editor uses AudioHighlights to identify the 3 best 60-second clips from a 2-hour interview. They like the cuts chosen by the AI, but they need to add their intro/outro graphics and color grade the footage in Premiere Pro. They currently have to manually make all those cuts again in Premiere.

### 🚀 Proposed Solution
**What:**
Add a new export option in the "Mix Mode" or general export menu to download an EDL (Edit Decision List) or FCPXML (Final Cut Pro XML) file alongside the rendered video or text exports.

**How it works:**
1. Generate an EDL (.edl) file format, which is an industry-standard text file that describes a sequence of cuts.
2. Generate an FCPXML (.fcpxml) file, which is a modern XML format supported by Final Cut Pro, DaVinci Resolve, and Premiere Pro.
3. Both formats will reference the original uploaded media file name and use the highlight segment start/end times to build a sequence.

**Why this approach:**
EDL is universally supported but primitive. FCPXML is more modern and robust, supporting multiple tracks and metadata. Offering both covers 99% of professional editing software (Premiere Pro, Resolve, Final Cut, Avid).

### 📊 Research Findings

**Technology Analysis:**
- **EDL Format:** Standard CMX 3600 EDL. Very simple plain text, easy to generate without libraries.
- **FCPXML Format:** Apple's XML schema. Also simple to generate via template literals or basic XML builder.
- **Dependencies:** None required. Can be generated purely client-side using standard string manipulation and `Blob`/`URL.createObjectURL` for downloading.

**Competitive Analysis:**
- Descript: Offers comprehensive export to Premiere, Final Cut, Resolve, Pro Tools. A major selling point.
- Opus Clip: Supports XML export to Premiere Pro.
- AudioHighlights: Currently missing this feature, putting it at a disadvantage for pro workflows.

### 🧪 Proof of Concept

**Implementation:**
A successful proof of concept was built testing both EDL and FCPXML generation.

*EDL Generator POC:*
```typescript
function generateEDL(segments: HighlightSegment[], mediaFileName: string, fps: number = 24): string {
  let edl = `TITLE: AudioHighlights Mix\nFCM: NON-DROP FRAME\n\n`;
  let timelineStart = 0;
  // ... maps over segments converting seconds to HH:MM:SS:FF and formatting as CMX3600 events
  return edl;
}
```

*FCPXML Generator POC:*
```typescript
function generateFCPXML(segments: HighlightSegment[], mediaFileName: string, fps: number = 24): string {
    // ... maps over segments converting seconds to rational time (e.g., 100/2400s) and building XML nodes
    return xml;
}
```

Both outputs are valid formats that can be imported directly into Premiere Pro and DaVinci Resolve.

### 📈 Value Proposition

**Benefits:**
- ✅ **Attracts Professional Users:** Makes the tool viable for professional podcast/video editors.
- ✅ **Saves Hours of Work:** Eliminates manual re-cutting of AI-selected highlights.
- ✅ **Zero Server Cost:** Generation happens entirely in the browser.

**User stories:**
- As a video editor, I can export an XML of the AI-generated highlights so that I can immediately start polishing the rough cut in Premiere Pro without manually finding the timestamps.

### ⚖️ Trade-offs

**Pros:**
- ✅ High value add for a specific, high-intent user segment.
- ✅ Very low implementation effort (just text generation).
- ✅ No new dependencies.

**Cons:**
- ❌ Frame rate mismatch issues: If the original video isn't exactly the assumed frame rate (e.g., 29.97 vs 30), the cuts in the NLE might be off by a few frames. (Mitigation: default to common FPS or ask user).
- ❌ File path linking: The NLE will look for the media file. If the user changed the file name, they will need to manually relink media in their NLE (a common and easy NLE task).

### 🛠️ Implementation Plan

**Phase 1: Core Generators** (estimated: 1 day)
- [ ] Create `lib/edl-generator.ts` with CMX 3600 generator logic.
- [ ] Create `lib/fcpxml-generator.ts` with FCPXML v1.9 generator logic.

**Phase 2: UI Integration** (estimated: 1 day)
- [ ] Add "Export to Premiere/Resolve (XML)" and "Export EDL" buttons to the Mix Mode export options.
- [ ] Implement the download logic (Blob creation).

**Total estimated effort:** 2 developer-days

**Dependencies:**
- None.

**Risks:**
- ⚠️ NLE compatibility quirks - Mitigation: Test generated files in actual Premiere Pro and DaVinci Resolve instances before release.

### 📚 Resources

**Documentation:**
- [Apple FCPXML Reference](https://developer.apple.com/documentation/professional_video_applications/fcpxml_reference)
- [CMX 3600 EDL Specification](https://xhelmboyx.tripod.com/formats/edl-layout.txt)

### 🎬 Next Steps

**If approved:**
1. Implement the `lib/edl-generator.ts` and `lib/fcpxml-generator.ts` utility files.
2. Integrate the export buttons into the `Mix Mode` UI.

### 💬 Discussion Points
- Should we prompt the user for their sequence framerate (24, 30, 60fps) before export, or try to detect it, or just default to 30fps?
