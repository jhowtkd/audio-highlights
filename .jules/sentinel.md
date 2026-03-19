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

## 2026-03-01 - Unauthenticated External API Endpoint & Info Disclosure

**Vulnerability:** An unauthenticated `/api/test-transcribe` endpoint was left in the codebase which triggered a real, paid external API (Groq Whisper) using a generated "silence" audio file. Additionally, the `/api/health` endpoint exposed environment variables (`NODE_ENV` and presence of `GROQ_API_KEY`).
**Root Cause:** Developer convenience during initial integration. A test endpoint was built to verify Groq API connectivity but was left exposed. The health check was also overly verbose for debugging.
**Learning:** Never leave unauthenticated or "test" endpoints that trigger costly third-party APIs in production builds. They can be exploited for resource exhaustion / Denial of Wallet (DoS). Similarly, health endpoints should be strictly "status ok", never exposing system configuration.
**Prevention:**
- Remove all `/test-*` or debugging API endpoints before committing, or secure them behind strict authentication checks.
- Keep `/api/health` endpoints minimalist. No environment, config, or internal states.
**Code:**
```typescript
// ❌ VULNERABLE - Information Disclosure in Health Check
return NextResponse.json({
    status: 'ok',
    env: { groq_configured: !!process.env.GROQ_API_KEY } // Exposes config state
});

// ✅ SECURE
return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString()
});
```
