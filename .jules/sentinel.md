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

## 2024-06-24 - DoS vulnerability via unbounded Zod schemas

**Vulnerability:** Zod schemas for transcription segments did not specify maximum lengths for string fields (`text`, `word`, `id`) and array sizes (`words`). This could allow attackers to send massive payloads, consuming excessive memory and CPU, leading to Denial of Service (DoS).
**Root Cause:** Schema validation assumed client-side data would be reasonably sized without explicitly enforcing bounds in the backend validation logic.
**Learning:** Always apply `.max()` limits to unbounded `z.string()` and `z.array()` structures that receive input from clients.
**Prevention:** Establish global maximums for lengths and array counts in `src/lib/constants.ts` and ensure all string/array properties in `zod` schemas refer to these constants.
**Code:**
```typescript
// Vulnerable pattern
export const transcriptionSegmentSchema = z.object({
  text: z.string(),
  words: z.array(z.object({
    word: z.string(),
  })).optional(),
});

// Secure pattern
export const transcriptionSegmentSchema = z.object({
  text: z.string().max(MAX_SEGMENT_TEXT_LENGTH),
  words: z.array(z.object({
    word: z.string().max(MAX_WORD_LENGTH),
  })).max(MAX_WORDS_COUNT).optional(),
});
```
