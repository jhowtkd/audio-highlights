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
## 2026-02-23 - DoS via Disk Exhaustion in Early Returns

**Vulnerability:** Uploaded files were not deleted when the API request failed validation. Attackers could exhaust disk space by repeatedly sending invalid requests with large files attached.
**Root Cause:** The `fs.unlink()` was omitted in early return paths in the `multer` endpoints.
**Learning:** When using `multer` for file uploads, ensure that any validation failure or early return correctly cleans up the temporary files from the disk before exiting.
**Prevention:** Always add a no-op `fs.unlink(req.file.path, () => {})` to early returns when a file has been uploaded but will not be processed further.
**Code:**
```typescript
// Vulnerable pattern
if (invalidParams) {
    res.status(400).json({ error: 'Invalid params' });
    return;
}

// Secure pattern
if (invalidParams) {
    fs.unlink(file.path, () => {});
    res.status(400).json({ error: 'Invalid params' });
    return;
}
```
