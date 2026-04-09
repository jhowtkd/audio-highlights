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

## 2026-02-12 - CSV Formula Injection in EDL Export

**Vulnerability:** The EDL generator exported a CSV file containing user-controlled text (`text`, `problemType`, `suggestion`, `reason`) without sanitizing leading characters. If an attacker provided text starting with `=`, `+`, `-`, `@`, `\t`, or `\r`, spreadsheet software like Excel could interpret it as a formula, leading to arbitrary code execution or data exfiltration on the user's machine (CSV Formula Injection).
**Root Cause:** The `generateCSV` function directly concatenated strings into the CSV format, only escaping double quotes (`"`), while ignoring formula triggers.
**Learning:** Always sanitize user-controlled fields before exporting to CSV by prepending a single quote (`'`) to strings starting with dangerous characters, forcing spreadsheet applications to treat the data as plain text.
**Prevention:** Implement and apply a `sanitizeCSVField` utility function for all string values written to CSV.
**Code:**
```typescript
// Vulnerable:
csv += `"${seg.text.replace(/"/g, '""')}"`;

// Secure:
function sanitizeCSVField(field: string): string {
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousChars.includes(field.charAt(0))) {
        return `'${field}`;
    }
    return field;
}
csv += `"${sanitizeCSVField(seg.text).replace(/"/g, '""')}"`;
```
