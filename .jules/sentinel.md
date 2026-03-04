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
## 2026-03-04 - Exposure of Internal Config and Active Debug Endpoints

**Vulnerability:** The application exposed internal environment variables (`NODE_ENV`, presence of `GROQ_API_KEY`) on the public unauthenticated `/api/health` endpoint. Additionally, an active debug endpoint (`/api/test-transcribe`) was present in production, allowing unauthenticated users to trigger external API calls to Groq.
**Root Cause:** The health check endpoint was originally built to include environment status for easy debugging, while a test endpoint was left in the codebase without authentication.
**Learning:** NEVER expose environment details (even seemingly harmless ones like `NODE_ENV`) on public unauthenticated endpoints. Active debug or test endpoints must be either removed prior to production deployment or secured with strict authentication to prevent resource exhaustion (Denial of Wallet).
**Prevention:**
- Only return a simple status (e.g., `status: 'ok'`) on health check endpoints.
- Ensure all test routes are removed before production or placed behind authentication.
