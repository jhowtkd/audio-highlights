## 2026-05-28 - Destructive Native Confirm Dialogs

**UX Problem:** The application was using the native `window.confirm()` method for destructive actions, specifically discarding an active project (with progress) and re-transcribing a file (which erases existing progress and costs credits). This blocked the main thread and provided a jarring, unstyled browser dialog that felt disconnected from the application's UI, especially on mobile.
**Learning:** Native `confirm` dialogs are easy to implement but lack accessibility support, can't be styled, and disrupt the user experience flow.
**Solution:** Built and integrated a custom `ConfirmDialog` component built on Radix UI primitives (`@radix-ui/react-dialog`) that provides a clear title, description, and configurable confirmation buttons. Hooked the dialog into React state across the dashboard, tasks list, and task detail pages.
**Pattern:** For this design system, ALL destructive actions must:
1. Use the custom `ConfirmDialog` component instead of `window.confirm()`.
2. Provide a clear title, message, and explicit button labels (e.g., "Retranscrever" instead of just "OK").
3. Use the `destructive` variant for the confirmation button to signify the danger of the action.
