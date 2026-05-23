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

## 2024-05-24 - Resource Exhaustion via Test Endpoints

**Vulnerability:** A test endpoint (`/api/test-transcribe`) that triggers an external API call to Groq was exposed in production. Attackers could call this endpoint repeatedly without authorization, leading to API quota depletion and potentially financial costs (Denial of Wallet).

**Root Cause:** The endpoint was created for development/testing purposes but left accessible in all environments. It lacked authentication, authorization, and rate limiting.

**Learning:** Test endpoints that consume resources or external APIs must NEVER be exposed in production. Even if they use small payloads (like 1 second of silence), the sheer volume of malicious requests can cause significant damage.

**Prevention:** Always disable test endpoints in production environments by checking `process.env.NODE_ENV === 'production'` and returning a 404 response. Better yet, move test logic to actual unit/integration tests and do not expose them via API routes.

**Code:**
```typescript
// Vulnerable pattern:
export async function GET() {
    // API call logic...
}

// Secure pattern:
export async function GET() {
    // Disable in production to prevent resource exhaustion
    if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Not Found', { status: 404 });
    }
    // API call logic...
}
```
