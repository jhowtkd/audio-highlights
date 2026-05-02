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

## 2026-05-02 - CSV Formula Injection in Exports

**Vulnerability:** User-provided text segments were exported to CSV format without sanitizing formula trigger characters (`=`, `+`, `-`, `@`, `\t`, `\r`), allowing potential CSV Formula Injection when opened in spreadsheet applications.
**Root Cause:** The `generateCSV` function only escaped quotes (`""`) but did not consider spreadsheet software behavior where fields starting with specific characters are evaluated as macros or formulas.
**Learning:** Always sanitize user-generated content exported to CSV by checking for and prefixing formula characters with a single quote (`'`), even if the data seems innocuous.
**Prevention:** Implement a dedicated `sanitizeCSVField` function for any CSV export functionality.
**Code:**
```typescript
// Vulnerable:
const field = `"${text.replace(/"/g, '""')}"`;

// Secure:
let sanitized = text.replace(/"/g, '""');
if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = "'" + sanitized;
}
const field = `"${sanitized}"`;
```
