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

## 2026-04-19 - CSV Formula Injection in EDL Generator

**Vulnerability:** Untrusted text fields (`text`, `problemType`, `suggestion`, `reason`) generated from potentially user-controlled or AI-generated strings were exported to CSV without sanitization, leading to potential CSV Formula Injection / DDE vulnerabilities if the resulting file was opened in Excel.
**Root Cause:** The `generateCSV` function in `src/lib/edl-generator.ts` correctly escaped double quotes but did not sanitize strings starting with dangerous characters (`=`, `+`, `-`, `@`, `\t`, `\r`) which spreadsheet software interprets as formulas.
**Learning:** Always sanitize fields exported to CSV by checking the first character, even if double quotes are escaped.
**Prevention:** Add a helper `sanitizeCSVField` function that prepends a single quote (`'`) to any string starting with `=`, `+`, `-`, `@`, `\t`, or `\r`.
**Code:**
```typescript
function sanitizeCSVField(value: string | undefined): string {
    if (!value) return '';
    const valStr = String(value);
    if (/^[=+\-@\t\r]/.test(valStr)) {
        return "'" + valStr;
    }
    return valStr;
}
```
