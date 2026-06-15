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
## 2026-01-24 - DoS vulnerability via massive segment texts

**Vulnerability:** The application was vulnerable to a potential Denial of Service (DoS) attack where malicious users could submit arbitrarily large string payloads in the `text` or `word` properties of `transcriptionSegmentSchema`.

**Root Cause:** The Zod validation schema for transcription segments only validated that the type was a `z.string()`, but lacked a maximum character length `.max()` constraint.

**Learning:** When using Zod to validate client payloads, always define explicit `.max()` limits for strings and arrays to prevent memory exhaustion and prompt injection vulnerabilities, especially when dealing with potentially huge datasets like transcription arrays.

**Prevention:** Ensure all `z.string()` definitions handling user or external API input in validations contain `.max()` with centralized constants.

**Code:**
```typescript
// Vulnerable
text: z.string()

// Secure
text: z.string().max(MAX_SEGMENT_TEXT_LENGTH)
```
