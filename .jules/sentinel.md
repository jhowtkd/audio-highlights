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

## 2026-02-16 - FFmpeg Stderr Leakage in Error Responses

**Vulnerability:** The `ffmpeg-service` microservice exposed raw `stderr` output from `ffmpeg` in API error responses, revealing internal file paths (`/tmp/...`) and system configuration details.

**Root Cause:** The error handling logic directly sliced the last 500 characters of `stderr` and returned it in the `details` field of the JSON response for debugging purposes, without sanitization.

**Learning:** Never return raw error output from system commands or external processes directly to the client. This violates "Fail Securely" and can aid attackers in reconnaissance.

**Prevention:** Log full error details (including stderr) to server-side logs (`console.error`) but return generic error messages to the client. Use a global error handler to catch unexpected errors and sanitize them.

**Code:**
```typescript
// Vulnerable:
res.status(500).json({ error: 'FFmpeg processing failed', details: stderr.slice(-500) });

// Secure:
console.error('[FFmpeg] Error:', stderr);
res.status(500).json({ error: 'FFmpeg processing failed. Please check server logs for details.' });
```
