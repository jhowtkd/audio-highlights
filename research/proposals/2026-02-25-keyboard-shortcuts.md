## 🔬 Researcher: Global Keyboard Shortcuts

### 🎯 Executive Summary
Implement global keyboard shortcuts to drastically improve the audio editing and review workflow. By using `react-hotkeys-hook`, we can give power users immediate control over playback, navigation, and highlighting without needing to constantly switch between keyboard and mouse.

### 💡 Problem Statement
**Current situation:**
The current `TranscriptViewer` and `AudioPlayer` require mouse clicks for all interactions: playing, pausing, seeking, and marking highlights.

**User impact:**
- **Efficiency:** Editors waste time moving the mouse to small buttons.
- **Precision:** "Scrubbing" or jumping back 5 seconds to re-listen to a word is cumbersome with sliders.
- **Accessibility:** Users who rely on keyboards cannot efficiently use the core editing features.

**Example scenario:**
A user is listening to a 1-hour podcast to find highlights. They hear a good quote but missed the start. They have to:
1. Stop typing notes.
2. Grab the mouse.
3. Locate the "Back 10s" button.
4. Click it.
5. Click Play.
6. Return to keyboard.
With shortcuts, they would just press `Left Arrow`.

### 🚀 Proposed Solution
**What:**
Integrate `react-hotkeys-hook` to bind global keys to player actions.

**How it works:**
- Wrap the main layout or specific providers with a `KeyboardShortcutsProvider`.
- Use `useHotkeys` hook to bind keys to `PlayerContext` actions.
- Ensure inputs (textareas, search) capture events correctly so shortcuts don't trigger while typing (except `Esc`).

**Why this approach:**
- **Standard Library:** `react-hotkeys-hook` is the standard for React, handling event bubbling, unbinding, and cross-platform issues.
- **Low Overhead:** Tiny bundle size (~3kb).
- **Maintainable:** Declarative hooks are easier to read than `document.addEventListener`.

### 📊 Research Findings

**Technology Analysis:**
- **Library:** `react-hotkeys-hook`
- **Maturity:** Stable (v4+)
- **Adoption:** 2M+ weekly downloads.
- **Bundle size:** ~3.2kB (minified + gzipped).
- **License:** MIT.

**Competitive Analysis:**
- **Descript:** Uses Space, Tab, Arrows, CMD+K heavily.
- **YouTube:** Space/K (Pause), J/L (Seek), M (Mute).
- **Spotify:** Space (Pause), Arrows (Seek).
- **Our App:** Currently has 0 shortcuts.

**Best Practices:**
- Allow users to disable shortcuts (optional future feature).
- Show a "Keyboard Shortcuts" modal (Cmd+?) to teach users.
- Prevent default behavior for keys like Space (scrolling).

### 🧪 Proof of Concept

**Implementation:**
```tsx
import { useHotkeys } from 'react-hotkeys-hook';

// Snippet
useHotkeys('space', (e) => {
  e.preventDefault(); // Stop scrolling
  togglePlay();
}, [isPlaying]);
```

**Demo:**
See `research/pocs/keyboard-shortcuts-poc.tsx` for a functional React component demonstrating the hook usage.

**Performance:**
- Before: N/A
- After: N/A
- Impact: Negligible. Event listeners are passive. Immediate response (<16ms) compared to mouse movement (seconds).

### 📈 Value Proposition

**Benefits:**
- ✅ **Speed:** Edit and review content 2-3x faster.
- ✅ **Ergonomics:** Less repetitive strain from mouse usage.
- ✅ **Professional Feel:** Matches expectations for "Pro" tools.

**User stories:**
- As a **Power User**, I want to keep my hands on the keyboard so I can transcribe and navigate simultaneously.
- As a **Reviewer**, I want to quickly jump back 5s when I miss a word.

### ⚖️ Trade-offs

**Pros:**
- ✅ High impact, low effort.
- ✅ Standard pattern.

**Cons:**
- ❌ **Conflicts:** Space bar causing scrolling (solvable with `preventDefault`).
- ❌ **Input Focus:** Must ensure shortcuts don't trigger when user is typing in the search bar or form fields.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Native `keydown` event listeners | No dependencies | Hard to manage unbinding and focus conflicts | Not chosen because `react-hotkeys-hook` handles edge cases automatically |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 0.5 days)
- [ ] Install `react-hotkeys-hook`.
- [ ] Create `useKeyboardControls` custom hook that interfaces with `AudioPlayer`.

**Phase 2: Integration** (estimated: 1 day)
- [ ] Attach hooks to the main `TranscriptViewer` or Layout.
- [ ] Ensure `AudioPlayer` exposes imperative handles or uses Context for control.

**Phase 3: Search & Polish** (estimated: 0.5 days)
- [ ] Bind `/` to focus the search input in `TranscriptViewer`.
- [ ] Add `Esc` to clear search.
- [ ] Add "Shortcuts" help tooltip.

**Total estimated effort:** 2 developer-days

**Dependencies:**
- `react-hotkeys-hook`

**Risks:**
- ⚠️ **Browser Conflicts:** Some browsers reserve keys. - Mitigation: Stick to standard keys (Space, Arrows) and avoid Cmd/Ctrl overrides if possible.

### 📚 Resources

**Documentation:**
- [react-hotkeys-hook Docs](https://react-hotkeys-hook.vercel.app/)

**Examples:**
- [YouTube Keyboard Shortcuts](https://support.google.com/youtube/answer/7631406)

**Community:**
- [GitHub repository](https://github.com/JohannesKlauss/react-hotkeys-hook)

### 🎬 Next Steps

**If approved:**
1. Install dependency.
2. Refactor `AudioPlayer` to allow external control (if not already Context-driven).
3. Implement the hooks.

**Questions to resolve:**
- [ ] Should we allow users to customize their shortcuts?
- [ ] Are there any existing conflicting shortcuts?

### 💬 Discussion Points
- Which specific shortcuts should we prioritize for the MVP?
