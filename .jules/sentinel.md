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

## 2025-02-24 - CORS Misconfiguration & File Cleanup DoS

**Vulnerability:** The ffmpeg-service allowed cross-origin requests from any domain ending in `.vercel.app`, and failed to clean up uploaded files if validation failed before processing, leading to potential disk space exhaustion (DoS).
**Root Cause:** Overly permissive `endsWith` check for CORS origin and missing `fs.unlink()` in early return error paths.
**Learning:** Always use strict regex or exact string matching for CORS origins. Ensure all execution paths that terminate a request with an uploaded file clean up the file system.
**Prevention:** Use `^https://prefix(-[a-zA-Z0-9-]+)?\.vercel\.app$` for Vercel preview domains. Wrap file upload handlers in a try-finally block or ensure early returns clean up temp files.
**Code:**
```typescript
// Secure CORS check
if (/^https:\/\/audio-highlights(-[a-zA-Z0-9-]+)?\.vercel\.app$/.test(origin)) {
    return callback(null, true);
}

// File cleanup in early returns
if (validationFailed) {
    fs.unlink(file.path, () => {});
    res.status(400).json({ error: 'Invalid' });
    return;
}
```
