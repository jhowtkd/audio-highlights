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
## 2024-05-18 - Disk Exhaustion DoS and CORS Misconfiguration in File Upload Microservice

**Vulnerability:** File uploads in `/cut-video` and `/concat-segments` left temporary files on disk when validation errors occurred, leading to potential disk space exhaustion (DoS). Additionally, CORS was overly permissive with `endsWith('.vercel.app')`, potentially allowing unauthorized preview deployments to access the API.
**Root Cause:** The express endpoints returned early on validation errors without explicitly unlinking `req.file.path`. The CORS configuration used a broad substring match instead of a strict regular expression.
**Learning:** Always ensure `fs.unlink()` is called on all code paths for file uploads, including validation errors. Never use loose string matching like `endsWith` for CORS when wildcards are needed, use a strict regex.
**Prevention:** For endpoints using multer, explicitly add `fs.unlink(file.path, () => {})` before returning an error response. Use regex for Vercel preview domains CORS: `/^https:\/\/audio-highlights(-[a-zA-Z0-9-]+)?\.vercel\.app$/`.
