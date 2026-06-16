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

## 2026-06-16 - Missing Timeouts on External API Calls

**Vulnerability:** External API calls to OpenAI and Groq (for transcriptions, highlights, decupagem, and search) and internal long-running chunked processing fetches lacked explicit timeouts. This could lead to server resource exhaustion and potential DoS if the external services hung or were slow to respond.
**Root Cause:** Reliance on default network timeouts (or lack thereof) when making external SDK calls and internal fetches.
**Learning:** Always enforce explicit, reasonable timeouts on all network requests (both external SDK calls and internal fetches) to ensure the system fails fast and securely, preventing thread/connection exhaustion.
**Prevention:** Add explicit `timeout` options to OpenAI/Groq SDK calls and use `AbortSignal.timeout()` on `fetch` calls.
**Code:**
```typescript
// Vulnerable:
const completion = await openai.chat.completions.create({...});
const response = await fetch('/api/transcribe', {...});

// Secure:
const completion = await openai.chat.completions.create({...}, { timeout: 30000 });
const response = await fetch('/api/transcribe', {..., signal: AbortSignal.timeout(180000)});
```
