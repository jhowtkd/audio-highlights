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

## 2025-05-18 - Information Disclosure in Health API Route

**Vulnerability:** The `/api/health` endpoint exposed internal server state variables to the public, such as whether specific API keys were configured and the current Node environment (`NODE_ENV`).

**Root Cause:** The endpoint was created to return `ok` status and provide additional debugging information, but developers did not consider that exposing environment state and configuration details publicly can provide valuable reconnaissance information to attackers.

**Learning:** NEVER expose internal server configurations or environment variables in public endpoints, especially unauthenticated health checks. Doing so allows attackers to footprint the application, identify available services, and potentially exploit specific configurations (like debug modes or mock environments).

**Prevention:** For public health endpoints:
- Only return a basic 'ok' status and timestamp.
- Do not expose configuration state, `NODE_ENV`, or the presence/absence of sensitive keys.
- Add a specific SECURITY comment to prevent future developers from adding debug information to the response payload.

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
        // SECURITY: Not exposing internal server state or env variables to prevent information disclosure
    });
}
```
