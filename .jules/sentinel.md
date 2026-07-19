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

## 2024-07-19 - Disk Exhaustion (DoS) via Unhandled Multer Uploads

**Vulnerability:** Uploaded files were not deleted when the API endpoints returned early due to validation errors. This allows an attacker to fill up the server's disk space by repeatedly sending invalid requests with large files.

**Root Cause:** The early return paths in the route handlers for `/cut-video` and `/concat-segments` were returning an HTTP error without explicitly calling `fs.unlink()` to clean up the temporary file created by `multer`.

**Learning:** Always ensure temporary files created by middleware (like `multer`) are cleaned up in *all* code paths, including validation failures and error handling.

**Prevention:** Add `fs.unlink(req.file.path, () => {})` to all early return blocks and catch blocks in endpoints that handle file uploads.

**Code:**
```typescript
// Vulnerable pattern found in this codebase:
if (isNaN(startTime)) {
    res.status(400).json({ error: 'Invalid start times' });
    return;
}

// Secure pattern to use:
if (isNaN(startTime)) {
    fs.unlink(req.file.path, () => {});
    res.status(400).json({ error: 'Invalid start times' });
    return;
}
```
