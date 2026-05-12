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

## 2026-05-12 - Missing Timeout on Native Fetch Calls

**Vulnerability:** External API calls using native `fetch` (e.g., to the Gemini API) lacked a timeout mechanism.
**Root Cause:** The `fetch` API does not have a default timeout, meaning requests can hang indefinitely if the external service is unresponsive or experiencing severe latency.
**Learning:** Always configure explicit timeouts for all external HTTP requests to prevent server-side resource exhaustion (hanging requests) and Denial of Service (DoS).
**Prevention:** Use `AbortSignal.timeout(ms)` when configuring `fetch` options in Node.js environments.
**Code:**
```typescript
// Vulnerable:
const response = await fetch(url, { method: 'POST', body });

// Secure:
const response = await fetch(url, {
  method: 'POST',
  body,
  signal: AbortSignal.timeout(60000)
});
```
