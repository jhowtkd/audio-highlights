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
## 2026-04-15 - CSV Formula Injection in EDL Generator

**Vulnerability:** The application generated CSV exports (`generateCSV` in `src/lib/edl-generator.ts`) containing user-controlled text (`seg.text`, `seg.problemType`, `seg.suggestion`, `seg.reason`) without sanitizing leading characters. This could allow an attacker to inject malicious formulas (like `=cmd|' /C calc'!A0`) that would execute when a user opens the CSV in a spreadsheet application like Microsoft Excel.
**Root Cause:** The CSV generator correctly escaped double quotes (`""`) but failed to account for characters that trigger formula evaluation (`=`, `+`, `-`, `@`, `\t`, `\r`) at the beginning of a cell value.
**Learning:** Standard CSV escaping (RFC 4180) is not sufficient for spreadsheet applications. Any data starting with formula indicators must be neutralized.
**Prevention:** Always prepend a single quote (`'`) to CSV fields that start with dangerous formula characters before exporting.

**Code:**
```typescript
// Vulnerable pattern found in this codebase:
csv += `"${seg.text.replace(/"/g, '""')}"`

// Secure pattern to use:
const sanitizeCSVField = (field: string | undefined): string => {
    if (!field) return '';
    const str = String(field);
    if (/^[=+\-@\t\r]/.test(str)) return "'" + str;
    return str;
};
csv += `"${sanitizeCSVField(seg.text).replace(/"/g, '""')}"`
```
