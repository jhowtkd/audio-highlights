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
## 2024-06-05 - Test Endpoint Exposed in Production

**Vulnerability:** A test endpoint (`/api/test-transcribe`) that performs actual API calls (to Groq) was fully accessible without any authentication or environment checks. This could lead to resource exhaustion, unauthorized API usage, and potential unexpected costs.

**Root Cause:** The endpoint was likely created for development and debugging purposes to verify the Groq integration but was left in the codebase without conditional logic to prevent it from running in production.

**Learning:** Always ensure that test or debug endpoints are strictly gated. If they must exist in the deployed code, they should check the environment and return a 404 or require administrative authentication in production.

**Prevention:** Add environment checks (`process.env.NODE_ENV === 'production'`) to any test endpoints to disable them in production, or better yet, keep test code strictly out of the `src/app/api` directory if possible.

**Code:**
```typescript
export async function GET() {
    // SECURITY: Disable this test endpoint in production to prevent resource exhaustion and unauthorized API usage
    if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Not Found', { status: 404 });
    }
    // ... test logic
}
```
