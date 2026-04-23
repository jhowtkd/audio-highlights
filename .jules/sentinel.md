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
## 2026-04-23 - CSV Formula Injection in EDL Generator

**Vulnerability:** The application exports transcription segments to a CSV file (`src/lib/edl-generator.ts`) but failed to sanitize user-controlled text (transcription text, problem type, suggestion, and reason). If a transcription contained segments starting with characters like `=`, `+`, `-`, or `@`, opening the exported CSV in spreadsheet software like Excel could execute arbitrary formulas (CSV Injection / Macro Injection).
**Root Cause:** The `generateCSV` function concatenated user-controlled data directly into the CSV structure. While double quotes were escaped for `seg.text`, it did not prefix malicious formula triggers with a safe character (like `'`) or apply escaping to the other text fields (`problemType`, `suggestion`, `reason`).
**Learning:** Always sanitize user input when generating CSVs, especially in applications processing unstructured text (like transcriptions or LLM outputs) that might inadvertently or maliciously begin with formula triggers. Furthermore, ensure all string fields, not just the primary text body, are escaped against double quotes.
**Prevention:**
- Prefix any CSV field starting with `=`, `+`, `-`, `@`, `\t`, or `\r` with a single quote (`'`).
- Ensure all string fields pass through the sanitization function, not just the "main" text field.
**Code:**
```typescript
// Vulnerable pattern
csv += `"${seg.text.replace(/"/g, '""')}","${seg.problemType}"\n`;

// Secure pattern
function sanitizeCSVField(field: string): string {
    if (!field) return '';
    let sanitized = field.replace(/"/g, '""');
    if (/^[=+\-@\t\r]/.test(sanitized)) {
        sanitized = "'" + sanitized;
    }
    return sanitized;
}
csv += `"${sanitizeCSVField(seg.text)}","${sanitizeCSVField(seg.problemType)}"\n`;
```
