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

## 2024-07-22 - Disk Exhaustion DoS via Unhandled Uploads

**Vulnerability:** Uploaded files via multer were not being deleted in early return paths (validation failures), allowing an attacker to quickly exhaust server disk space by repeatedly uploading large files with invalid parameters.

**Root Cause:** Error handling and validation logic returned HTTP responses without cleaning up the temporary files created by multer in `req.file.path`.

**Learning:** When using multer for file uploads, the file is saved to disk *before* the route handler's logic executes. Every early return or validation failure path must explicitly delete the uploaded file to prevent disk exhaustion (DoS).

**Prevention:** Always ensure `fs.unlink()` is explicitly called on `req.file.path` in all early return and validation error paths. Use a no-op callback (e.g., `fs.unlink(file.path, () => {})`) to safely handle asynchronous deletion without crashing if the file is missing.

**Code:**
```typescript
// Vulnerable pattern:
if (invalid) {
  res.status(400).json({ error: 'Invalid input' });
  return;
}

// Secure pattern:
if (invalid) {
  fs.unlink(req.file.path, () => {});
  res.status(400).json({ error: 'Invalid input' });
  return;
}
```
