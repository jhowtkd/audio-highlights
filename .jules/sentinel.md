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
## 2026-03-05 - Information Disclosure in Public Endpoints

**Vulnerability:** Public unauthenticated endpoints (`/api/health` and `/api/test-transcribe`) were exposing sensitive environment variables (`NODE_ENV` and `GROQ_API_KEY` configuration status) and allowing unauthorized triggering of the Groq API, which could lead to resource exhaustion and potential system probing.

**Root Cause:** The `health` endpoint was written to echo configuration states back to clients for debugging purposes without checking for authentication or removing the environment-specific keys. The `test-transcribe` endpoint was left in production code without authentication checks or removal.

**Learning:** Publicly accessible endpoints must never expose internal system configuration details like environment variable presence or current environments (`NODE_ENV`), and debugging routes triggering paid external APIs should be strictly authenticated or removed from production completely to prevent unauthenticated resource exhaustion and exposure of system info.

**Prevention:**
- Keep `/api/health` endpoints barebones: just `status: 'ok'` and maybe a `timestamp`.
- Do not leave `/test-*` or debugging routes in production code.
- Always apply authentication to endpoints that trigger external, paid, or authenticated resources.

**Code:**
```typescript
// Vulnerable pattern found in this codebase:
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: {
            groq_configured: !!process.env.GROQ_API_KEY,
            node_env: process.env.NODE_ENV,
        }
    });
}

// Secure pattern to use:
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
}
```
