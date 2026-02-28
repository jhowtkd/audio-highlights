## 2025-02-18 - React Dropzone Accessibility

**UX Problem:** `react-dropzone` defaults to `role="presentation"` on the root element, making the drop zone invisible to screen reader users as an interactive button, even though it has `tabIndex={0}`.

**Learning:** Visual users see a "box" to click, but screen readers just see a focusable group with no role.

**Solution:** Explicitly pass `role: 'button'` and a descriptive `aria-label` to `getRootProps`.

**Pattern:** For `react-dropzone` usage in this app:
1. Pass `role: 'button'` to `getRootProps`.
2. Provide a clear `aria-label` describing the action (e.g., "Upload file").
3. Ensure status messages (uploading, error) have `role="status"` or `role="alert"`.

## 2025-02-24 - Search Results Keyboard Trap

**UX Problem:** Search results in `TranscriptViewer` were rendered as `div` elements with `onClick`. Keyboard users could search but not navigate or select results.

**Learning:** Interactive lists implemented as `div`s are invisible to keyboard navigation.

**Solution:** Converted `div`s to `<button>` elements with `type="button"`, `w-full`, and `text-left` to maintain layout while adding keyboard accessibility.

**Pattern:** For interactive list items:
1. Always use `<button type="button">`.
2. Use `w-full text-left` to mimic list item appearance.
3. Ensure focus styles (`focus-visible`) are present.
4. Avoid `div` with `onClick` unless implementing a custom widget with full ARIA roles (which is usually overkill).

## 2025-02-26 - Audio Player Sliders Accessibility

**UX Problem:** The Radix UI Slider (via shadcn/ui) has accessibility props (`aria-label`, `aria-valuetext`) on the Root element, but they are often forgotten when wrapping it, leaving screen reader users with just a "slider" role and a raw number (e.g., "50") without context (Volume? Progress? Seconds? Percent?).

**Learning:** `aria-valuetext` is crucial for sliders representing non-integer or unit-based values (time, percentage).

**Solution:** Added `aria-label` and `aria-valuetext` with formatted strings (`formatDuration`).

**Pattern:** For Sliders:
1. Always provide `aria-label` identifying the control.
2. If the value has units (seconds, percent), provide `aria-valuetext`.

## 2026-03-01 - HighlightCard Accessibility and Feedback Updates

**UX Problem:**
The alternative titles section lacked clear accessibility semantics for expanding/collapsing and identifying the active title. Additionally, the copy button for individual quotes did not provide temporary visual interaction feedback, making it unclear to users if the copy action succeeded.

**Learning:**
Accessibility semantics (like `aria-expanded` and `aria-pressed`) are vital for dynamic elements to be perceivable by screen readers. When displaying lists of items that have individual temporary states (like a copy confirmation timer), those items should be isolated into sub-components. Otherwise, updating the copy state for one item causes the entire parent component to re-render, which can be inefficient and complicate state management.

**Solution:**
- Added `aria-expanded` and `aria-controls` to the "Ver títulos alternativos" toggle button.
- Added `aria-pressed` to the selectable title buttons.
- Extracted a `QuoteRow` sub-component to encapsulate the quote and its copy button.
- Added local `isCopied` state to `QuoteRow` to show a temporary checkmark icon and dynamically update the `aria-label` (e.g., from "Copiar frase" to "Frase copiada").

**Pattern:**
For lists of interactive elements requiring temporary feedback (like copy actions):
1. Extract the list item into its own component.
2. Manage the feedback timer state (`isCopied`) locally within that sub-component using `useRef` and `useEffect` for cleanup.
3. Use `aria-pressed` for selection buttons and `aria-expanded` for toggles.
4. Dynamically update `aria-label` when the icon changes to ensure screen reader users receive the feedback.
