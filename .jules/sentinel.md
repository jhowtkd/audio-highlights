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

## 2024-04-14 - CSV Formula Injection in EDL Exports

**Vulnerability:** The application generates CSV files from user-controlled input (transcript text, problem types, reasons) without sanitizing the data. If an attacker injects text starting with `=, +, -, @`, spreadsheet applications like Excel could execute formulas or arbitrary code when a user opens the downloaded file.
**Root Cause:** The `generateCSV` function in `src/lib/edl-generator.ts` directly concatenated object properties into the CSV format without checking for formula injection vectors.
**Learning:** Always sanitize user input before rendering it into CSV or similar formats that can be opened by rich client applications. A common and robust mitigation for Formula Injection is prepending a single quote (`'`) to any string that begins with a dangerous character.
**Prevention:** For any CSV generation, implement a sanitize function that checks for the first character of each field and prepends a quote if it belongs to the dangerous list (`['=', '+', '-', '@', '\t', '\r']`).
**Code:**
```typescript
function sanitizeCSVField(field: string): string {
    if (!field) return '';
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousChars.some(char => field.startsWith(char))) {
        return `'${field}`;
    }
    return field;
}
```
