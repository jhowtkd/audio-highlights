## 🔬 Researcher: Unified Multi-Format Export Options Menu

### 🎯 Executive Summary
Introduce a unified "Export Menu" component to expose existing but hidden multi-format export capabilities (SRT, VTT, Markdown, Text, JSON) for both full transcripts and individual highlights. This unlocks professional workflows for video editors and content creators by allowing them to download the exact format they need for their specific tools (Premiere, Resolve, Descript, etc.).

### 💡 Problem Statement
**Current situation:**
The application has robust export functions implemented in `src/lib/export.ts` (`generateSRT`, `generateVTT`, `generateMarkdown`, etc.), but the user interface only exposes a single default export option (typically plain text or basic SRT) through simple download buttons.

**User impact:**
Video editors, podcasters, and content creators are forced to manually convert exported text into subtitles or structured formats they need for their post-production pipeline, adding friction and time to their workflow.

**Example scenario:**
A content creator generates a great highlight for a YouTube Short. They want to import it directly into CapCut or Premiere as a `.srt` file for automatic captions, but the UI only allows copying the text to the clipboard or downloading a generic text file.

### 🚀 Proposed Solution
**What:**
Create a reusable `ExportMenu` component (using Radix UI Dropdown Menu, which is standard in our stack) that allows users to select their desired export format:
- Subtitles (SRT, VTT) for video editors
- Documents (Markdown, Plain Text) for show notes and blogs
- Data (JSON) for custom integrations

**How it works:**
1. Implement a generic `ExportMenu` component that accepts an item type (`highlight` or `transcript`) and the raw data.
2. The menu presents the available formats.
3. Upon selection, it calls the appropriate existing function from `src/lib/export.ts` and triggers the browser download via `downloadFile`.
4. Replace existing basic download buttons in `TranscriptViewer` and `HighlightCard` with this new component.

**Why this approach:**
This is a high-ROI feature because the backend/library code for generating these formats already exists and is tested. We only need to build the UI to expose this functionality to the user, leveraging our existing UI component library.

### 📊 Research Findings

**Technology Analysis:**
- **Library/Framework:** React + Radix UI (Dropdown Menu)
- **Maturity:** Stable
- **Adoption:** Standard in our current Next.js + Tailwind + shadcn/ui stack.
- **Dependencies:** None new. Reuses existing `@radix-ui/react-dropdown-menu`.

**Competitive Analysis:**
- Descript: Offers extensive export options (Timeline, Subtitles, Text, Audio).
- Riverside.fm: Exports to SRT, VTT, and TXT standard.
- OpusClip: Provides immediate downloads for captions (SRT) and XML for Premiere.

**Best Practices:**
- Provide clear labels for formats (e.g., "Subtitles (.srt) - Best for Premiere").
- Group related formats together (Subtitles vs. Documents).
- Ensure the export action is immediately responsive.

### 🧪 Proof of Concept

**Implementation:**
A simple implementation of the `ExportMenu` component:

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateSRT, generateVTT, generateMarkdown, generateText, generateJSON, downloadFile
} from "@/lib/export";
import type { GeneratedHighlight } from "@/types";

interface ExportMenuProps {
  highlight: GeneratedHighlight;
  filenamePrefix?: string;
}

export function ExportMenu({ highlight, filenamePrefix = "highlight" }: ExportMenuProps) {
  const handleExport = (format: string, generator: (h: GeneratedHighlight) => string, ext: string) => {
    const content = generator(highlight);
    const mimeType = ext === 'json' ? 'application/json' : 'text/plain';
    downloadFile(content, `${filenamePrefix}-${highlight.id}.${ext}`, mimeType);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Exportar opções">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Formato de Exportação</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('SRT', generateSRT, 'srt')}>
          Subtitles (.srt)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('VTT', generateVTT, 'vtt')}>
          Web Subtitles (.vtt)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('Text', generateText, 'txt')}>
          Plain Text (.txt)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('Markdown', generateMarkdown, 'md')}>
          Markdown (.md)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('JSON', generateJSON, 'json')}>
          Data (.json)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 📈 Value Proposition

**Benefits:**
- ✅ Unlocks professional post-production workflows.
- ✅ Saves users time by eliminating manual format conversion.
- ✅ Maximizes the value of existing codebase features.

**User stories:**
- As a video editor, I can export highlights as SRT files so that I can instantly import them into Premiere Pro as captions.
- As a content marketer, I can export the full transcript as Markdown so that I can quickly format it into a blog post.

### ⚖️ Trade-offs

**Pros:**
- ✅ Very low implementation effort (logic already exists).
- ✅ High user value for power users and professionals.
- ✅ No new dependencies required.

**Cons:**
- ❌ Adds slight UI complexity (a dropdown instead of a single click for the default format).

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Settings page default | User can set their preferred format globally, single click export. | Requires adding user preferences state/storage. | Not chosen initially, but could be a future enhancement. A dropdown is more flexible. |
| Modal with options | Can provide more context/preview. | Heavier UI, slower interaction. | Not chosen because export is a frequent, quick action. |

### 🛠️ Implementation Plan

**Phase 1: Component Creation** (estimated: 0.5 days)
- [ ] Create `src/components/ui/dropdown-menu.tsx` (if not already fully implemented).
- [ ] Create `src/components/shared/export-menu.tsx`.

**Phase 2: Integration** (estimated: 0.5 days)
- [ ] Update `src/components/highlights/highlight-card.tsx` to replace the existing download button with `ExportMenu`.
- [ ] Update `src/components/transcription/transcript-viewer.tsx` to include an `ExportMenu` for the full transcript.

**Phase 3: Testing & Polish** (estimated: 0.5 days)
- [ ] Ensure all generated formats are valid.
- [ ] Check accessibility of the dropdown menus (ARIA attributes, keyboard navigation).

**Total estimated effort:** 1.5 developer-days

**Dependencies:**
- `@radix-ui/react-dropdown-menu` (Already in package.json?) If not, install via standard shadcn/ui command.

**Risks:**
- ⚠️ None significant. The core logic is already present and tested.

### 📚 Resources

**Documentation:**
- [Radix UI Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)
- [shadcn/ui Dropdown Menu](https://ui.shadcn.com/docs/components/dropdown-menu)

### 🎬 Next Steps

**If approved:**
1. Create the `ExportMenu` UI component.
2. Integrate it into `HighlightCard`.
3. Integrate it into `TranscriptViewer`.

**Questions to resolve:**
- [ ] Should we support exporting *all* highlights as a single zip file containing multiple formats?
- [ ] Do we need a "Copy to Clipboard" option within the export menu, or keep it separate?

### 💬 Discussion Points
- Which format is the most critical for our primary user persona? Should we make that one a "1-click" default alongside the dropdown?
