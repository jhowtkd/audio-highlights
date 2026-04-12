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

## 2026-04-12 - CSV Formula Injection in EDL Export

**Vulnerability:** User-controlled inputs (`text`, `problemType`, `suggestion`, `reason` within `DecupageSegment`) were directly interpolated into a generated CSV file without checking for dangerous characters. This could allow an attacker (or a malicious LLM payload) to inject formulas that execute code when the CSV is opened in spreadsheet software like Excel.
**Root Cause:** The `generateCSV` function in `src/lib/edl-generator.ts` correctly escaped double quotes but failed to sanitize the leading character of fields.
**Learning:** Preventing CSV Formula Injection (DDE Injection) requires checking the first character of any dynamically inserted string against a list of dangerous characters (`=`, `+`, `-`, `@`, `\t`, `\r`) and prepending a single quote (`'`) to force the spreadsheet to interpret it as literal text.
**Prevention:** Always use a dedicated sanitizer function for user-controlled strings before adding them to a CSV.
**Code:**
```typescript
function sanitizeCSVField(field: string): string {
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    if (field && dangerousChars.some(char => field.startsWith(char))) {
        return `'${field}`;
    }
    return field;
}
```
