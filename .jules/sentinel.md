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

## 2026-04-02 - CSV Formula Injection in EDL Export

**Vulnerability:** User-controlled inputs (`seg.text`, `seg.problemType`, `seg.suggestion`, `seg.reason`) were concatenated directly into a CSV string without sanitization. An attacker could inject malicious formulas (starting with `=`, `+`, `-`, `@`, `\t`, `\r`) that would be executed by spreadsheet applications like Excel when the CSV is opened.
**Root Cause:** The `generateCSV` function in `src/lib/edl-generator.ts` naively concatenated string fields into the CSV row format without checking for dangerous leading characters.
**Learning:** Always sanitize user-controlled strings before writing them to CSV files to prevent formula injection attacks.
**Prevention:** Implement a sanitization function that prepends a single quote (`'`) to fields starting with dangerous characters before appending them to the CSV.
**Code:**
```typescript
// Vulnerable:
csv += `...,"${seg.text}","${seg.problemType}",...`;

// Secure:
function sanitizeCSVField(field: string): string {
    if (!field) return '';
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousChars.includes(field[0])) {
        return `'${field}`;
    }
    return field;
}
csv += `...,"${sanitizeCSVField(seg.text)}","${sanitizeCSVField(seg.problemType)}",...`;
```
