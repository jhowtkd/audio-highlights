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

## 2026-02-21 - Information Disclosure in Error Messages

**Vulnerability:** The `ffmpeg-service` returned full error details (including `stderr` from `ffmpeg` processes and stack traces) in 500 responses to the client. This could expose internal file paths, version information, or environment details to an attacker.

**Root Cause:** The error handling logic explicitly included `details: stderr` or `details: err.message` in the JSON response, prioritizing debugging convenience over security.

**Learning:** Never return internal error details or stack traces to the client in production. Use server-side logging for debugging and return generic, sanitized error messages to the user.

**Prevention:** Sanitize all error responses in API endpoints. Log the full error to the server console (or a logging service) but return a generic "Internal server error" or "Processing failed" message to the client.

**Code:**
```typescript
// Vulnerable:
res.status(500).json({ error: 'FFmpeg failed', details: stderr });

// Secure:
console.error('[FFmpeg] Error:', stderr);
res.status(500).json({ error: 'FFmpeg processing failed' });
```
