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
## 2025-07-07 - Rate Limiting API Endpoints

**Vulnerability:** No rate limiting on public API endpoints (`/api/transcribe`, `/api/highlights`, `/api/search`, `/api/decupagem`).
**Root Cause:** The Next.js API routes were created without middleware or endpoint-level rate limits.
**Learning:** In a production Next.js application, especially one communicating with external LLM APIs (OpenAI, Groq), missing rate limiting is a severe risk for DoS and quota exhaustion.
**Prevention:** Implement an in-memory (or Redis-backed) rate limiter (e.g., using `lru-cache`) for all routes. We introduced `src/lib/rate-limit.ts` to manage this per IP address.
**Code:**
```typescript
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
});

// Inside route handler:
const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown-ip';
try {
    await limiter.check(5, ip);
} catch {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
}
```
