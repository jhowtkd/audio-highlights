## 2026-01-28 - Unbounded String Inputs in Zod Schemas

**Vulnerability:** User-controlled string inputs (`episodeTitle`, `focusTopics`, `narrativeContext`) lacked maximum length constraints in Zod schemas, allowing potential DoS or prompt injection via massive payloads.

**Root Cause:** The schemas were initially designed for flexibility without considering the security implications of unbounded inputs in a server-side context where they might be processed by LLMs or stored.

**Learning:** Always apply `.max()` limits to `z.string()` and `z.array()` inputs that come from the client, especially if they are used in expensive operations (like LLM prompts) or have potential to exhaust memory.

**Prevention:** Define global constants for maximum lengths (e.g., `MAX_EPISODE_TITLE_LENGTH`) in `src/lib/constants.ts` and apply them in `src/lib/validations.ts`.

**Code:**
```typescript
// Vulnerable:
episodeTitle: z.string().optional()

// Secure:
episodeTitle: z.string().max(MAX_EPISODE_TITLE_LENGTH).optional()
```

## 2026-02-06 - Unsanitized File Extensions

**Vulnerability:** File extensions were extracted from filenames without validation and used to construct file paths.
**Root Cause:** `getExtension` function simply returned the substring after the last dot.
**Learning:** Even when constructing paths in `tmpdir`, allowing arbitrary extensions can be dangerous if the file is passed to tools like `ffmpeg` or `fluent-ffmpeg` that might misinterpret shell metacharacters or file types.
**Prevention:** Enforce strict alphanumeric validation (or a whitelist) for file extensions.
**Code:**
```typescript
// Vulnerable:
return fileName.substring(lastDot);

// Secure:
if (!/^\.[a-zA-Z0-9]+$/.test(ext)) return '';
```
## 2026-01-24 - Disk Exhaustion via Multer Uploads

**Vulnerability:** API endpoints using `multer` for file uploads were missing cleanup (`fs.unlink`) on early return paths (e.g., input validation failures). Attackers could exhaust disk space by repeatedly sending invalid requests with large file payloads, which `multer` would save to disk but the application would never delete.

**Root Cause:** `multer` saves the file to disk before the route handler logic executes. The handler performs validation and returns early on failure, bypassing the cleanup logic that only executes in the success or explicit error handling blocks further down.

**Learning:** When using middleware that creates files (like `multer`), you must ensure the file is explicitly deleted in ALL execution paths, especially early returns for validation errors.

**Prevention:** Always include `fs.unlink(file.path, () => {})` before any early `return res.status(...)` in endpoints that accept file uploads. Consider using a `finally` block or dedicated cleanup middleware for complex routes.

**Code:**
```typescript
// Vulnerable pattern:
if (isNaN(startTime)) {
    res.status(400).json({ error: 'Invalid start time' });
    return;
}

// Secure pattern:
if (isNaN(startTime)) {
    fs.unlink(file.path, () => {});
    res.status(400).json({ error: 'Invalid start time' });
    return;
}
```
