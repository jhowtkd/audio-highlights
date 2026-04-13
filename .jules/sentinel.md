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

**Vulnerability:** The application generated CSV files from user-controlled content (`text`, `problemType`, `suggestion`, `reason` fields) without sanitization. If an attacker provided input starting with `=`, `+`, `-`, or `@`, spreadsheet applications like Excel could interpret it as a formula, leading to arbitrary command execution.
**Root Cause:** The `generateCSV` function in `src/lib/edl-generator.ts` blindly concatenated string fields into a CSV format without checking for formula prefixes.
**Learning:** Never trust user input when generating CSVs. Always sanitize fields to prevent CSV Formula Injection (CSVi) by prepending an apostrophe (`'`) to any field starting with a dangerous character.
**Prevention:** Always implement a sanitization function for CSV exports:
- Check for prefixes like `=`, `+`, `-`, `@`, `\t`, `\r`
- Prepend `'` if a dangerous character is found.
**Code:**
```typescript
function sanitizeCSV(value: string): string {
    if (!value) return value;
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousChars.includes(value.charAt(0))) {
        return "'" + value;
    }
    return value;
}
```
