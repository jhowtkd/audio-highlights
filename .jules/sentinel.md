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
## 2024-06-07 - Test Endpoint Exposed in Production

**Vulnerability:** A test endpoint (`/api/test-transcribe`) that interacts with external APIs (Groq Whisper model) and performs file creation tasks was accessible in all environments, including production.

**Root Cause:** The endpoint was created to verify API keys and integration during development, but lacked an environment check to disable it when deployed.

**Learning:** Any endpoint created specifically for testing or debugging must explicitly check `process.env.NODE_ENV` and return an error (like a 404 Not Found) if running in production. This prevents unauthorized users from discovering and abusing these endpoints, which could lead to resource exhaustion, API rate limiting, or quota consumption.

**Prevention:** Always verify test routes (`*.test.ts` or routes starting with `test-`) are either excluded from production builds or include a strict environment guard at the very beginning of the request handler.

**Code:**
```typescript
// Secure pattern to use at the top of test handlers:
if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
}
```
