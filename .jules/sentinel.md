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

## 2024-07-27 - Disk Exhaustion (DoS) via Unhandled File Uploads

**Vulnerability:** When using `multer` to handle file uploads, uploaded files are temporarily saved to disk before route logic executes. If the request fails early validation (e.g., missing or invalid parameters) and returns without explicitly deleting the file (`fs.unlink`), the temporary files accumulate on disk. This can lead to disk space exhaustion and a Denial of Service (DoS).

**Root Cause:** The early return statements for validation errors did not clean up the `req.file` object created by `multer`. `multer` assumes the route handler is responsible for deleting or moving the temporary file once uploaded.

**Learning:** Always ensure that any code paths that exit early (due to validation failures, authorization errors, etc.) properly clean up temporary resources like uploaded files. In Express, using an empty callback `fs.unlink(file.path, () => {})` is a safe way to clean up without crashing if the file is absent.

**Prevention:** For all API endpoints accepting file uploads:
- Explicitly call `fs.unlink(req.file.path, () => {})` on every early return/error path.
- Alternatively, use memory storage if files are small, or implement an automated cleanup job for the temp directory.

**Code:**
```typescript
// Vulnerable pattern found in this codebase:
if (isNaN(startTime)) {
    res.status(400).json({ error: 'Invalid start time' });
    return; // File remains on disk!
}

// Secure pattern to use:
if (isNaN(startTime)) {
    fs.unlink(file.path, () => {});
    res.status(400).json({ error: 'Invalid start time' });
    return;
}
```
