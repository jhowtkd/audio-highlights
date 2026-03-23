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

## 2026-03-23 - Information Disclosure in Health Endpoint

**Vulnerability:** The `/api/health` endpoint returned the `process.env.NODE_ENV` value and checking the existence of API keys.

**Root Cause:** The endpoint was designed to debug the backend without considering the risk of exposing sensitive deployment details and environmental states to unauthorized public access.

**Learning:** Public endpoints (e.g., `/api/health`) must not expose environment configuration details such as `NODE_ENV` or the presence of API keys to prevent information disclosure.

**Prevention:** Ensure that health check endpoints return strictly generalized operational status (e.g., `status: 'ok'`) without leaking runtime state, environment specifics, or configurations.

**Code:**
```typescript
// Vulnerable:
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

// Secure:
export async function GET() {
    // SECURITY: Prevent information disclosure.
    // Do not expose env variables like NODE_ENV or API key presence in public health endpoints.
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
}
```
