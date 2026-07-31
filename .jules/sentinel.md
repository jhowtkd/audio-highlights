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

## 2024-05-30 - Overly Permissive CORS Configuration

**Vulnerability:** The CORS configuration allowed any origin ending in `.vercel.app` to access the service, which combined with `credentials: true` could allow any attacker-controlled Vercel deployment to interact with the API.
**Root Cause:** A convenience wildcard was used for Vercel preview environments without restricting it to the specific project's namespace.
**Learning:** Never use broad domain suffix matching (like `.endsWith('.vercel.app')`) for CORS, especially when credentials are allowed, as these platforms host untrusted third-party code.
**Prevention:** Use exact origin matching or strict regular expressions that bind to the specific project name (e.g., `/^https:\/\/project-name-[a-zA-Z0-9-]+\.vercel\.app$/`).
**Code:**
```typescript
// Vulnerable pattern found in this codebase:
if (origin.endsWith('.vercel.app')) { return callback(null, true); }

// Secure pattern to use:
if (/^https:\/\/audio-highlights-[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) { return callback(null, true); }
```
