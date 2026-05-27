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

## 2025-02-14 - Test Endpoint Exposed in Production

**Vulnerability:** A test endpoint (`/api/test-transcribe`) that triggers external API calls (Groq Whisper) was exposed in production. This could lead to resource exhaustion, unauthorized API usage, and potential denial-of-service if abused by malicious actors.
**Root Cause:** The endpoint was created for development testing but lacked a check to restrict its availability to development environments only.
**Learning:** Test endpoints, especially those that consume third-party API credits or perform heavy processing, must never be exposed in production without strict authentication and authorization, or should be completely disabled.
**Prevention:** Always wrap test or debug endpoints with environment checks (e.g., `process.env.NODE_ENV === 'production'`) to disable them or return a 404 status in production. Review all endpoints for proper environment gating before deployment.
**Code:**
```typescript
// Vulnerable pattern found in this codebase:
export async function GET() {
    // ... test logic ...
}

// Secure pattern to use:
export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return new NextResponse(null, { status: 404 });
    }
    // ... test logic ...
}
```
