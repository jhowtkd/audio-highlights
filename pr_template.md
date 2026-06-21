## 🎨 Palette: Replace Native Confirm Dialogs with Custom Accessible Dialogs

### 💡 What
Replaced native `window.confirm()` and `confirm()` calls across the application (`src/app/page.tsx`, `src/app/tasks/[id]/page.tsx`, and `src/components/tasks/task-card.tsx`) with a custom, accessible `<ConfirmDialog>` component based on Radix UI.

### 🎯 Why
Native browser confirmation dialogs block the main UI thread, interrupting the user experience and halting animations. They also ignore the application's design system and styling, leading to a jarring visual shift. Replacing them with a custom component provides a seamless, consistent, and accessible experience.

### 📸 Before / After
**Before:**
Users encountered unstyled, thread-blocking native browser alerts when clicking "Retranscrever arquivo", "Excluir projeto", or starting a new project when progress already existed.

**After:**
Users now see a styled, non-blocking modal (`<ConfirmDialog>`) that integrates smoothly with the existing Next.js / Tailwind CSS design system and correctly traps focus.

### ♿ Accessibility
- Implemented accessible modals using Radix UI primitives (`@radix-ui/react-dialog`) inside the custom `<ConfirmDialog>`.
- Restored focus management and keyboard trapping which was handled natively before but unstylishly.
- Addressed potential UI thread freezing that negatively impacts assistive technologies.

### 🧪 Testing
- [x] All tests pass
- [x] Linting passes
- [x] Keyboard navigation tested
- [x] Color contrast verified
- [x] Responsive behavior checked

### 📝 Notes
Added the `src/components/ui/confirm-dialog.tsx` component to handle the dialog state visually.
