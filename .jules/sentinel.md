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
## 2025-02-28 - DoS via Memory Exhaustion in Zod Schemas

**Vulnerability:** The Zod schemas for transcription segments lacked explicit `.max()` limits for strings and arrays. This allowed an attacker to send extremely large payloads (e.g., massive segment texts, arbitrarily long IDs, or millions of words per segment) that would be fully parsed and held in memory, potentially crashing the server (Denial of Service).

**Root Cause:** While the number of segments was limited (`MAX_SEGMENTS_COUNT`), the internal fields of each segment (`id`, `text`, `words` array) had no upper bounds. `z.string()` and `z.array()` default to unbounded unless explicitly constrained.

**Learning:** When validating complex nested JSON payloads, limiting the outer array is not enough. EVERY unbounded type (strings, arrays) must have explicit maximums defined, especially when those objects are kept in memory for further processing (like being mapped, sorted, or passed to other APIs).

**Prevention:** To prevent Denial of Service (DoS) attacks via memory exhaustion from massive client payloads, always apply explicit `.max()` limits to `z.string()` and `z.array()` structures within Zod validation schemas (e.g., `src/lib/validations.ts`), referencing centralized maximum length constants from `src/lib/constants.ts`.

**Code:**
```typescript
// Vulnerable pattern found in this codebase:
export const transcriptionSegmentSchema = z.object({
  id: z.string(),
  text: z.string(),
  words: z.array(z.object({
    word: z.string(),
  })).optional()
});

// Secure pattern to use:
export const transcriptionSegmentSchema = z.object({
  id: z.string().max(MAX_ID_LENGTH, "ID exceeds maximum length"),
  text: z.string().max(MAX_TEXT_LENGTH, "Text exceeds maximum length"),
  words: z.array(z.object({
    word: z.string().max(MAX_WORD_LENGTH, "Word exceeds maximum length"),
  })).max(MAX_WORDS_PER_SEGMENT, "Too many words in segment").optional()
});
```
