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

## 2026-02-11 - Path Traversal Vulnerability in File Extension Logic

**Vulnerability:** The `getExtension` function naively extracted file extensions using `lastIndexOf` and substring, allowing path traversal sequences (e.g., `file.mp3/../../evil`) to pass through as valid extensions in some contexts, or at least failing to reject them.

**Root Cause:** The implementation focused on functional extraction without security validation, assuming file names would be simple.

**Learning:** File path manipulation functions must always include strict validation. Never trust that a filename is just a filename.

**Prevention:** Enforce strict alphanumeric validation on file extensions (`^\.[a-zA-Z0-9]+$`). Reject anything that doesn't match.

**Code:**
```typescript
// Vulnerable:
return fileName.substring(fileName.lastIndexOf('.'));

// Secure:
const ext = fileName.substring(fileName.lastIndexOf('.'));
if (!/^\.[a-zA-Z0-9]+$/.test(ext)) return '';
return ext;
```
