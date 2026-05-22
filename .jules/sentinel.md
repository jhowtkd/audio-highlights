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

## 2026-02-23 - Test Endpoints Exposed in Production

**Vulnerability:** A test endpoint (`/api/test-transcribe`) that interacts with an external API (Groq) was accessible in production without any authentication or rate limiting. This allowed unauthorized users to exhaust the application's external API quotas or potentially cause a denial of service (DoS) by triggering repeated expensive requests.

**Root Cause:** The endpoint was created for development/testing purposes to verify API integration but lacked a mechanism to restrict its execution to development or non-production environments.

**Learning:** Ensure all non-essential test or debug endpoints are disabled or heavily protected in production environments to prevent unauthorized access and resource exhaustion.

**Prevention:** Add environment checks (e.g., `process.env.NODE_ENV === 'production'`) at the beginning of test endpoints to immediately return a 404 or 403 response in production.

**Code:**
```typescript
// Vulnerable:
export async function GET() {
    // ... test logic ...
}

// Secure:
export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return new NextResponse(null, { status: 404 });
    }
    // ... test logic ...
}
```
