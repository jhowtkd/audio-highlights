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

## 2026-04-16 - CSV Formula Injection in Exports

**Vulnerability:** User-provided text (transcription segments, reasoning) was exported directly to CSV files without sanitization. If opened in spreadsheet applications like Excel, fields starting with `=`, `+`, `-`, or `@` could be interpreted as formulas, leading to arbitrary command execution (DDE Injection).

**Root Cause:** The `generateCSV` function concatenated user-controlled strings into a CSV format, only escaping double quotes but failing to prevent spreadsheet software from interpreting the leading characters as executable formulas.

**Learning:** When generating CSV files from user-generated or external data, always sanitize fields to prevent CSV Formula Injection. The standard defense is to prepend a single quote (`'`) to any field starting with dangerous characters (`=`, `+`, `-`, `@`, `\t`, `\r`).

**Prevention:** Implement a `sanitizeForCSV` function that checks for the dangerous leading characters and prepends a single quote. Apply this function to all text fields before inserting them into the CSV row.

**Code:**
```typescript
function sanitizeForCSV(value: string): string {
    if (!value) return '';
    if (/^[=+\-@\t\r]/.test(value)) {
        return `'${value}`;
    }
    return value;
}
```
