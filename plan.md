1. **Create the `ConfirmDialog` component**: Create `src/components/ui/confirm-dialog.tsx` to provide an accessible and styled confirmation dialog using shadcn/ui primitives.
2. **Update `src/components/tasks/task-card.tsx`**: Replace the native `confirm()` in `handleRetranscribe` with the new `ConfirmDialog` component.
3. **Update `src/app/tasks/[id]/page.tsx`**: Replace the native `confirm()` in `handleRetranscribe` with the new `ConfirmDialog` component.
4. **Update `src/app/page.tsx`**: Replace the native `window.confirm()` in `handleReset` with the new `ConfirmDialog` component.
5. **Add Journal Entry**: Append a journal entry to `.jules/palette.md` noting the replacement of native confirm dialogs with an accessible component.
6. **Pre-commit steps**: Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
7. **Submit pull request**: Run the attempt_completion or submit tool to submit the changes.
