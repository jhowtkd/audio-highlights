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
## 2026-07-08 - DoS via Unbounded Inputs

**Vulnerability:** The Zod validation schemas allowed arbitrarily large strings and arrays in the request payloads, potentially leading to Denial of Service via memory exhaustion and heavy parsing overhead.

**Root Cause:** While Zod provides validation for types (`z.string()`, `z.array()`), default instances do not enforce maximum lengths or item counts unless explicitly specified with bounds like `.max()`.

**Learning:** When validating incoming JSON payloads, it is critical to always enforce strict `.max()` boundaries for arrays and strings. Never assume input size is naturally constrained by external limitations.

**Prevention:** Define length boundaries explicitly in `constants.ts` and apply them directly to schemas: `z.string().max(MAX_LENGTH)`, `z.array(...).max(MAX_ITEMS)`.

**Code:**
```typescript
// Vulnerable
export const transcriptionSegmentSchema = z.object({
  text: z.string(),
  words: z.array(...)
});

// Secure
export const transcriptionSegmentSchema = z.object({
  text: z.string().max(MAX_SEGMENT_TEXT_LENGTH),
  words: z.array(...).max(MAX_WORDS_PER_SEGMENT)
});
```
