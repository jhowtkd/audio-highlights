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

## 2026-02-12 - Missing Timeouts on External API Calls

**Vulnerability:** External SDK calls (OpenAI, Groq) were missing explicit timeouts. In case of network issues or slow API responses, this could lead to hanging requests and resource exhaustion (Denial of Service).
**Root Cause:** The default timeout for the OpenAI Node.js client is 10 minutes, which is too long for a typical web application request, especially considering Vercel's function timeout limits.
**Learning:** Always explicitly configure timeouts for external API calls and SDK clients to fail fast and prevent resource starvation.
**Prevention:** Add `timeout: ms` configuration to all OpenAI client instantiations.
**Code:**
```typescript
// Vulnerable
const openai = new OpenAI({ apiKey });

// Secure
const openai = new OpenAI({ apiKey, timeout: 60000 });
```
