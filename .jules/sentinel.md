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

## 2026-03-01 - Information Disclosure in Health Endpoint

**Vulnerability:** The public `/api/health` endpoint returned an `env` object that exposed internal environment variables (`process.env.NODE_ENV` and `!!process.env.GROQ_API_KEY`) to unauthenticated users.

**Root Cause:** The endpoint was likely designed to provide debugging or configuration info during development but was exposed publicly without considering the implications of leaking server state.

**Learning:** Public health or status endpoints must NEVER expose environment variables, configuration details, API key presence, or internal server state, as this information can be valuable for reconnaissance by attackers.

**Prevention:** Health endpoints should only return a minimal, non-sensitive status indicator (e.g., `{"status": "ok"}`) and optionally a timestamp. All debugging/configuration info should be restricted to authenticated, privileged endpoints.

**Code:**
```typescript
// Vulnerable pattern found in this codebase:
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        env: {
            node_env: process.env.NODE_ENV,
        }
    });
}

// Secure pattern to use:
export async function GET() {
    // SECURITY: Prevent information disclosure by not exposing environment state in health endpoint
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
}
```
