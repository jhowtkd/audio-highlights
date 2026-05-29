## 2026-05-29 - Missing `aria-hidden="true"` in Icon-Only Buttons

**UX Problem:** Screen readers were reading both the `aria-label` on the button and attempting to announce the decorative SVG content.
**Learning:** Even when icon-only buttons have an `aria-label`, the internal SVG element may still be exposed to the accessibility tree unless explicitly hidden.
**Solution:** Added `aria-hidden="true"` to the inner SVG icons of buttons that already had or needed `aria-label` attributes.
**Pattern:** Always add `aria-hidden="true"` to decorative icons inside buttons, especially icon-only buttons that rely on `aria-label`.
