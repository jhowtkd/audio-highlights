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

## 2026-03-07 - Information Disclosure and Unauthenticated Debug Routes

**Vulnerability:**
1. A test route (`/api/test-transcribe`) was exposed without any authentication, executing an expensive transcription task (Groq API). This allows an unauthenticated user to spam the endpoint and exhaust API resources (Denial of Wallet).
2. The `/api/health` endpoint returned environment-specific values (`NODE_ENV`, presence of `GROQ_API_KEY`). This leaks application configuration details to the public.

**Root Cause:**
1. The developer left an active test endpoint in production that had no guardrails or authentication for executing API-heavy requests.
2. The developer used the healthcheck to verify environmental setups but exposed this detailed information directly in the response payload.

**Learning:** NEVER expose endpoints that consume resources (APIs, databases) without rate limiting and authentication, especially debug/test routes. Ensure healthcheck endpoints only expose generic success states and never leak environment data or configurations.

**Prevention:**
- For resource-intensive operations, ensure proper authentication checks and rate limits are in place.
- Delete debug or test routes that are not intended for production.
- Healthcheck endpoints should return only a simple status (e.g., `status: "ok"`) and perhaps a timestamp.

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
        timestamp: new Date().toISOString()
    });
}
```
