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

## 2024-05-18 - Disk Space Exhaustion (DoS) via Unlinked File Uploads

**Vulnerability:** Endpoints handling file uploads via `multer` can cause disk space exhaustion if they return early due to validation errors without explicitly deleting the uploaded file from the disk.

**Root Cause:** The `multer` middleware automatically saves the uploaded file to disk *before* the route handler's logic executes. If the handler returns a 400 Bad Request due to invalid parameters (e.g., missing start/end times), the temporary file remains on disk indefinitely.

**Learning:** Always explicitly `fs.unlink()` the uploaded file (`req.file.path`) in *every* error or early return path of the route handler. Do not rely solely on the main success/failure paths to handle cleanup.

**Prevention:** For all endpoints using file upload middleware:
- Ensure `fs.unlink(req.file.path)` is called immediately before returning an error response for validation failures.
- Implement automated cleanup mechanisms (e.g., a cron job or background task) for abandoned files in the upload directory as a defense-in-depth measure.

**Code:**
```typescript
// Vulnerable pattern found in this codebase:
if (isNaN(startTime) || isNaN(endTime)) {
    res.status(400).json({ error: 'Invalid start/end times' });
    return;
}

// Secure pattern to use:
if (isNaN(startTime) || isNaN(endTime)) {
    fs.unlink(file.path, () => {});
    res.status(400).json({ error: 'Invalid start/end times' });
    return;
}
```
