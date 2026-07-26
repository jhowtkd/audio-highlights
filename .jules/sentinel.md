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
## 2024-07-26 - Unhandled Multer File Upload Disk Exhaustion

**Vulnerability:** File uploads managed by multer were not being cleaned up (via `fs.unlink`) when input validation failed and the API returned early. This could lead to disk space exhaustion (DoS) over time as temporary files accumulate.

**Root Cause:** The early return error paths in `ffmpeg-service/src/index.ts` lacked cleanup code for the uploaded file in `req.file.path`.

**Learning:** Always explicitly delete uploaded files in all early return and validation error paths when using multer, not just on success or processing failure.

**Prevention:** Ensure `fs.unlink(file.path, () => {})` is called in all validation error branches of endpoints accepting file uploads.

**Code:**
```typescript
if (isNaN(startTime)) {
    if (file?.path) fs.unlink(file.path, () => { });
    res.status(400).json({ error: 'Invalid start time' });
    return;
}
```
