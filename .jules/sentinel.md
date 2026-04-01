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

## 2024-05-18 - CSV Formula Injection in EDL Export

**Vulnerability:** The application allowed users to export decupagem segments as CSV without sanitizing the output. If a segment's text, problem type, suggestion, or reason started with characters like `=`, `+`, `-`, or `@`, spreadsheet software like Microsoft Excel would interpret them as executable formulas (CSV Formula Injection / CSV Injection). This could lead to arbitrary command execution on the user's machine if the exported CSV is opened.

**Root Cause:** The application directly embedded string properties from the `DecupageSegment` objects into the CSV string (`generateCSV` function in `src/lib/edl-generator.ts`) without any sanitization other than basic escaping of double quotes. It failed to account for formula evaluation vulnerabilities in spreadsheet programs.

**Learning:** Always sanitize user-controlled fields before exporting them to CSV format. Spreadsheet software often evaluates fields starting with specific characters as formulas.

**Prevention:** Before adding fields to a CSV string, check if they start with dangerous characters (`=`, `+`, `-`, `@`, `\t`, `\r`) and prepend a single quote (`'`) to neutralize them.

**Code:**
```typescript
function sanitizeCSVField(field: string): string {
    if (!field) return field;
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousChars.some(char => field.startsWith(char))) {
        return `'${field}`;
    }
    return field;
}
```
