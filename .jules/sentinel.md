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
## 2026-05-10 - Missing Timeout on External API Calls

**Vulnerability:** The Gemini API client (`src/lib/gemini-client.ts`) lacked a timeout in its `fetch` configuration.
**Root Cause:** The `fetch` API does not implement a default timeout, leaving it vulnerable to hanging indefinitely if the external service stops responding or experiences extreme latency, leading to possible resource exhaustion.
**Learning:** Always use `AbortSignal.timeout()` when making external HTTP requests using native `fetch` in Node.js/Next.js to prevent Denial of Service (DoS) conditions through thread pool or connection starvation.
**Prevention:**
- Enforce timeouts on all external requests.
- Configure `signal: AbortSignal.timeout(ms)` in all `fetch` options.

**Code:**
```typescript
// Vulnerable
const response = await fetch(url, { method: 'POST', body });

// Secure
const response = await fetch(url, {
  method: 'POST',
  body,
  signal: AbortSignal.timeout(30000)
});
```
