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

## 2026-03-11 - Information Disclosure in Public API Endpoint

**Vulnerability:** The `/api/health` endpoint, which is publicly accessible, exposed internal environment variables (`node_env: process.env.NODE_ENV`). This configuration detail can give potential attackers insights into the environment.

**Root Cause:** Developers often add environment details in health check endpoints for debugging purposes, without considering the security implications of exposing this information to the public.

**Learning:** Public endpoints must not expose environment configuration details such as `NODE_ENV` or the presence of API keys. Only return information strictly necessary for the endpoint's purpose.

**Prevention:** Ensure that health check endpoints only return basic status information and do not include sensitive internal environment details.

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
    // SECURITY: Prevent information disclosure of environment configuration
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: {
            groq_configured: !!process.env.GROQ_API_KEY,
        }
    });
}
```
