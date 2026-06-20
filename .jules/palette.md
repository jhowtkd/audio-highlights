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

## 2026-02-27 - WAI-ARIA disclosure and menu attributes
**UX Problem:** The toggle button for suggested titles in HighlightCard and the export menu dropdown in TranscriptViewer lacked the appropriate ARIA attributes.
**Learning:** Screen readers require these attributes to understand the state and the relationships between these elements.
**Solution:** Added `aria-expanded` and `aria-controls` to the suggested titles toggle in `HighlightCard`, and `aria-haspopup="menu"`, `aria-expanded`, and `aria-controls` to the export dropdown in `TranscriptViewer`. Additionally, added `role="menu"` to the dropdown container and `role="menuitem"` to its items.
**Pattern:** For this design system, interactive dropdowns and toggles that reveal additional content must always include the `aria-expanded` and `aria-controls` attributes linking the button to the hidden container. Dropdown menus should implement the full WAI-ARIA menu structure.
## 2024-06-20 - Custom Confirm Dialogs for Destructive Actions

**UX Problem:** The application was using native `window.confirm()` dialogs for destructive actions like deleting projects or retranscribing. These native dialogs block the main thread, are inconsistent across browsers, cannot be styled to match the brand, and create a jarring experience for users.

**Learning:** Native alerts and confirms break the immersion of the application's design system and interrupt the user flow abruptly. They also don't support custom styling (like "destructive" red buttons) to adequately warn users about the severity of an action.

**Solution:** Implemented a reusable, accessible `<ConfirmDialog>` component using the existing `@/components/ui/dialog` Radix primitives. Refactored the `TaskCard`, `[id]/page.tsx`, and `page.tsx` components to use this custom dialog instead of the native `confirm()` and `window.confirm()` functions, utilizing React state to manage visibility asynchronously.

**Pattern:** For all destructive or critical actions requiring confirmation:
1. Never use `window.confirm()` or `window.alert()`.
2. Use the `<ConfirmDialog>` component with appropriate `title`, `message`, and `confirmVariant="destructive"`.
3. Manage the dialog's state asynchronously within the parent component using `isOpen` and `onOpenChange`.
