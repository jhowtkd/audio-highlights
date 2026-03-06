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

## 2024-03-24 - Unauthenticated Resource Exhaustion via Test Routes

**Vulnerability:** An unauthenticated `/api/test-transcribe` endpoint was left in the codebase. This endpoint triggered a real request to the paid Groq external API, generating a 1-second WAV file and submitting it for transcription. Anyone could call this endpoint repeatedly, causing unauthenticated resource exhaustion and financial drain.

**Root Cause:** The endpoint was likely created for local development or testing but was not removed or secured with authentication before being committed to the repository.

**Learning:** Test, debug, or "health check" routes that call external paid APIs MUST NEVER be left unauthenticated or in production code without strict authorization. They are prime targets for resource exhaustion attacks.

**Prevention:**
- Always remove test endpoints that trigger external APIs before creating a PR.
- If a test endpoint is absolutely necessary, enforce strict authentication.
- Regularly review all endpoints in `src/app/api` to ensure no debug functionality is exposed.

**Code:**
```typescript
// Vulnerable pattern found in this codebase (removed):
export async function GET() {
    // ... creates silence.wav ...
    const response = await client.audio.transcriptions.create({
        file: file,
        model: GROQ_WHISPER_MODEL,
    });
    // ...
}
```
