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

## 2026-03-15 - Unauthenticated API Triggering External Costs

**Vulnerability:** A public, unauthenticated endpoint (`/api/test-transcribe`) made direct requests to the paid Groq API.
**Root Cause:** A test endpoint used during development was left in the codebase, accessible to anyone.
**Learning:** Test routes that trigger external APIs or heavy computations must never be pushed to production without authentication, as they expose the application to financial DoS and resource exhaustion.
**Prevention:** Remove debug/test endpoints before committing, or secure them behind strict authentication checks and rate limiting.

## 2026-03-15 - Information Disclosure in Health Check

**Vulnerability:** The public `/api/health` endpoint exposed environment details, specifically `NODE_ENV` and the presence of `GROQ_API_KEY`.
**Root Cause:** The health check returned verbose debug data intended for developers, exposing internal configuration to external users.
**Learning:** Public health endpoints should only return generic status information (e.g., `status: 'ok'`). Verbose environment data can aid attackers in footprinting the application.
**Prevention:** Never include `process.env` or related status flags in public API responses.
**Code:**
```typescript
// Vulnerable:
return NextResponse.json({ status: 'ok', env: { node_env: process.env.NODE_ENV } });

// Secure:
return NextResponse.json({ status: 'ok' });
```
