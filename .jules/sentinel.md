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

## 2026-06-24 - Resource Exhaustion via Hanging External API Calls

**Vulnerability:** The application made external requests to multiple APIs (OpenAI, Groq, Gemini) without explicit timeouts. This could lead to hanging requests that consume server resources and connections, eventually causing denial of service (DoS) or increased cloud bills.

**Root Cause:** Reliance on default SDK or `fetch` timeouts, which are often either infinite or excessively long, failing to explicitly bound the execution time for network operations.

**Learning:** External API dependencies and internal `fetch` operations should always have explicitly configured timeouts. This applies to both raw HTTP requests (`AbortSignal.timeout`) and abstracted SDK method parameters (`{ timeout: ms }`). It's a critical layer of defense-in-depth against unresponsive services and resource exhaustion.

**Prevention:**
- For raw `fetch` calls, use `signal: AbortSignal.timeout(ms)`.
- For OpenAI/Groq SDKs, use the `{ timeout: ms }` option in the request config.
- Add an automated check or lint rule to ensure network operations explicitly configure execution timeouts.

**Code:**
```typescript
// Vulnerable pattern found in this codebase:
await fetch(url, { ... })
await getGroqClient().audio.transcriptions.create({ ... })

// Secure pattern to use:
await fetch(url, { signal: AbortSignal.timeout(30000), ... })
await getGroqClient().audio.transcriptions.create({ ... }, { timeout: 60000 })
```
