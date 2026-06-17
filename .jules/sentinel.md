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
## 2025-06-17 - Unbounded External API Requests

**Vulnerability:** External API requests using the `fetch` API or `OpenAI` client (which wraps `fetch`) were made without explicit timeouts. This could lead to resource exhaustion if the remote server hangs or is slow to respond, potentially causing denial-of-service (DoS).
**Root Cause:** Developer oversight. Default `fetch` and SDK requests might not have suitable timeouts for the application's context.
**Learning:** Always configure explicit timeouts for all external requests and internal API calls to prevent hanging connections and resource exhaustion. Use `timeout: ms` for OpenAI/Groq clients and `signal: AbortSignal.timeout(ms)` for `fetch` operations.
**Prevention:** Mandate explicit timeout definitions for any `fetch` or SDK client instantiation across the codebase.
**Code:**
```typescript
// Vulnerable pattern
fetch('/api/endpoint');

// Secure pattern
fetch('/api/endpoint', { signal: AbortSignal.timeout(30000) });
```
