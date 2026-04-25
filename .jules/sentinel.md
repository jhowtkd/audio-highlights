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

## 2025-04-25 - CSV Injection in EDL Generator

**Vulnerability:** CSV exports generated user-controlled content (`Text`, `Problem`, `Suggestion`, `Reason`) without sanitization. If the text starts with `=, +, -, @`, spreadsheet programs (like Excel) can execute the content as formulas when opened, which is a CSV injection vulnerability.
**Root Cause:** The system only escaped double quotes to handle valid CSV formatting, but forgot to sanitize fields that start with formula characters.
**Learning:** Always sanitize user-provided text in CSV exports by prefixing fields that start with dangerous characters (`=`, `+`, `-`, `@`, `\t`, `\r`) with a single quote (`'`).
**Prevention:** Ensure any text field that gets inserted into a CSV string is sanitized.
**Code:**
```typescript
// Vulnerable:
csv += `"${seg.text.replace(/"/g, '""')}"\n`;

// Secure:
function sanitizeCSVField(field: string): string {
    if (!field) return '';
    if (['=', '+', '-', '@', '\t', '\r'].some(char => field.startsWith(char))) {
        return "'" + field;
    }
    return field;
}
const safeText = sanitizeCSVField(seg.text).replace(/"/g, '""');
csv += `"${safeText}"\n`;
```
