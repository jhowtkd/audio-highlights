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

## 2026-02-14 - CSV Formula Injection in EDL Exports

**Vulnerability:** User-controlled text segments in Decupagem could be exported to a CSV file. If a segment began with formula characters (like `=`), it could be executed by spreadsheet applications (CSV Formula Injection / CWE-1236).

**Root Cause:** The `generateCSV` function in `src/lib/edl-generator.ts` appended raw text from `DecupageSegment` objects directly into CSV rows without checking for formula prefixes.

**Learning:** When exporting data to CSV formats, any field potentially controlled by users (even partially, such as transcriptions) must be sanitized. Escaping quotes (`"`) prevents escaping the cell, but does not prevent formula execution if the cell text starts with formula triggers.

**Prevention:** Prefix any cell that begins with `=`, `+`, `-`, `@`, `\t`, or `\r` with a single quote (`'`) to force spreadsheet programs to interpret the content as plain text rather than an executable formula.

**Code:**
```typescript
// Vulnerable:
csv += `"${seg.text.replace(/"/g, '""')}"`;

// Secure:
function sanitizeCsvCell(value: string): string {
    if (!value) return '';
    const str = String(value);
    if (/^[=+\-@\t\r]/.test(str)) {
        return "'" + str;
    }
    return str;
}
const text = sanitizeCsvCell(seg.text).replace(/"/g, '""');
csv += `"${text}"`;
```
