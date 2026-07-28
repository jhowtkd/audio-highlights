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
## 2026-01-24 - File Leak in File Upload Error Handling

**Vulnerability:** Application exhausts disk space by not explicitly cleaning up temporary files managed by Multer when a request is rejected in early validation checks.

**Root Cause:** Multer successfully saves the file to disk before the controller logic executes. If the controller throws an error or returns early during validation, the temporary file remains on disk forever.

**Learning:** Any endpoint accepting file uploads must reliably clean up the temporary files, regardless of whether the request succeeds or fails early.

**Prevention:** Always call `fs.unlink(req.file.path, () => {})` in all validation error branches and in global error handlers for requests containing a file.

**Code:**
```typescript
// Vulnerable
if (invalidData) {
    res.status(400).json({ error: 'Invalid data' });
    return;
}

// Secure
if (invalidData) {
    fs.unlink(req.file.path, () => {});
    res.status(400).json({ error: 'Invalid data' });
    return;
}
```
