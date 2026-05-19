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
## 2026-05-19 - Resource Exhaustion via Unprotected Test Endpoints

**Vulnerability:** A `/api/test-transcribe` endpoint was exposed globally without authentication or rate limiting. When called via a simple GET request, the endpoint executed an external API call to the Groq Whisper service using the server's API key. This allowed an attacker to drain the application's API quota/credits by repeatedly requesting the endpoint, causing financial loss and denial of service.

**Root Cause:** Test endpoints are often committed to version control and deployed to production by mistake without proper environment checks, exposing potentially expensive logic.

**Learning:** Any endpoint that initiates server-side actions, particularly ones involving third-party API keys or computational resources, must be protected against abuse, even if they are just for debugging or testing. If a test endpoint is not needed in production, it should be disabled or protected by environment checks.

**Prevention:**
- Add checks like `if (process.env.NODE_ENV === 'production') return 404;` to testing routes.
- Use explicit rate limiting for all unauthenticated endpoints to prevent resource exhaustion.
- Require authentication for administrative or debugging actions.

**Code:**
```typescript
// Vulnerable pattern
export async function GET() {
    const client = getGroqClient();
    const response = await client.audio.transcriptions.create({...});
    // ...
}

// Secure pattern
export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    // ... test logic
}
```
