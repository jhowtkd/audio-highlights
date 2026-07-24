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
## 2024-05-30 - Permissive CORS Wildcard & Upload DoS

**Vulnerability:** Permissive CORS allowed any `*.vercel.app` domain, and early return paths in file upload handlers did not delete temporary `multer` files.
**Root Cause:** Using `.endsWith('.vercel.app')` is dangerous because anyone can host a Vercel app. Also, forgetting to clean up `multer` files in early return validation errors leaves dangling files, leading to disk exhaustion.
**Learning:** NEVER use wildcard suffix matching for CORS (like `.endsWith`). Always use a strict Regex to limit access to known preview/production domains. Always ensure `fs.unlink()` is explicitly called on `req.file.path` in ALL early return paths when handling file uploads.
**Prevention:**
- For CORS: Use regex `/^https:\/\/project-name(-[a-zA-Z0-9-]+)?\.vercel\.app$/`.
- For file uploads: Use `fs.unlink(req.file.path, () => {})` before returning an error response.

**Code:**
```typescript
// Vulnerable CORS pattern:
if (origin.endsWith('.vercel.app')) return callback(null, true);

// Secure CORS pattern:
if (/^https:\/\/audio-highlights(-[a-zA-Z0-9-]+)?\.vercel\.app$/.test(origin)) return callback(null, true);
```
