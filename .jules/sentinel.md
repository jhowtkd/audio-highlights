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

## 2026-06-11 - Exposed Test Endpoints in Production

**Vulnerability:** The `/api/test-transcribe` endpoint was exposed and accessible in the production environment.
**Root Cause:** The endpoint was created for testing purposes but lacked any environment checks or authentication to restrict its use.
**Learning:** Test endpoints that perform external API calls or consume resources must be disabled or properly secured in production environments to prevent unauthorized usage and resource exhaustion (e.g., hitting rate limits or incurring costs for external services).
**Prevention:** Always add a check at the beginning of test or debug endpoints: `if (process.env.NODE_ENV === 'production') { return NextResponse.json({ error: 'Not Found' }, { status: 404 }); }`. This ensures they fail securely without leaking information.
**Code:**
```typescript
// Vulnerable:
export async function GET() {
    try {
        const client = getGroqClient();
        // ... test logic
    }
}

// Secure:
export async function GET() {
    // SECURITY: Disable test endpoint in production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    try {
        const client = getGroqClient();
        // ... test logic
    }
}
```
