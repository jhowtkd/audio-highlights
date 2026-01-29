## 2026-01-29 - Missing Input Length Validation

**Vulnerability:** Input fields like `episodeTitle`, `focusTopics`, and `narrativeContext` lacked explicit length limits, potentially allowing massive payloads (DoS) or database/processing issues.

**Root Cause:** Developers often focus on type validation (string/number) but forget length constraints. Zod's `.string()` allows strings of any length by default.

**Learning:** Always pair `.string()` with `.max()` for user-controlled inputs. Define shared constants for these limits to ensure consistency across the app.

**Prevention:**
- Add `MAX_LENGTH` constants in `src/lib/constants.ts`.
- Enforce `.max(MAX_LENGTH)` in all Zod schemas.
- Add unit tests to verify rejection of oversized inputs.

**Code:**
```typescript
// Vulnerable
episodeTitle: z.string().optional(),

// Secure
episodeTitle: z.string().max(MAX_EPISODE_TITLE_LENGTH).optional(),
```
