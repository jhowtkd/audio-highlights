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

## 2024-05-18 - CSV Formula Injection in EDL Generator

**Vulnerability:** The application was generating CSV files for the Decupagem feature without sanitizing the user-provided text data. If a transcript segment or reason started with a dangerous character (e.g., `=`, `+`, `-`, `@`), opening the resulting CSV in spreadsheet applications like Excel could execute unintended formulas or commands.

**Root Cause:** The `generateCSV` function in `src/lib/edl-generator.ts` was naively concatenating properties from `DecupageSegment` objects into the CSV string without checking for formula injection vectors.

**Learning:** When generating CSVs from untrusted or dynamic data (even transcription text, which might be malicious or coincidentally start with a formula trigger), always sanitize the fields to prevent CSV Formula Injection. This is a common and often overlooked vulnerability in data export features.

**Prevention:** Before adding a dynamic field to a CSV, check if it starts with any dangerous characters (`=`, `+`, `-`, `@`, `\t`, `\r`). If it does, prepend a single quote (`'`) to neutralize the formula execution in spreadsheet software.

**Code:**
```typescript
/**
 * Sanitizes a string for CSV export to prevent Formula Injection (CSV Injection).
 */
function sanitizeCSVField(field: string | undefined): string {
    if (!field) return '';
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    let sanitized = field.replace(/"/g, '""');
    if (dangerousChars.some(char => sanitized.startsWith(char))) {
        sanitized = "'" + sanitized;
    }
    return sanitized;
}
```
