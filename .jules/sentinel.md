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

## 2026-07-29 - Disk Exhaustion DoS via Unhandled Uploads

**Vulnerability:** File uploads (via multer) that failed early validation (e.g., invalid start/end times, invalid segment format) were not deleted from the filesystem, leading to potential disk exhaustion (DoS).
**Root Cause:** Early return statements for validation errors did not include `fs.unlink()` cleanup for the uploaded `req.file`.
**Learning:** Always ensure temporary uploaded files are explicitly deleted on ALL return paths, especially early validation failures, to prevent disk space exhaustion (DoS) vulnerabilities.
**Prevention:** Explicitly call `fs.unlink(file.path, () => {})` before returning a validation error if `file` exists.
**Code:**
```typescript
// Vulnerable:
if (isNaN(startTime) || isNaN(endTime)) {
    res.status(400).json({ error: 'Invalid start/end times' });
    return;
}

// Secure:
if (isNaN(startTime) || isNaN(endTime)) {
    if (file) fs.unlink(file.path, () => {});
    res.status(400).json({ error: 'Invalid start/end times' });
    return;
}
```
