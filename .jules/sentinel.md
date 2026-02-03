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

## 2026-02-03 - File Extension Injection in Audio Conversion

**Vulnerability:** The `getExtension` utility used `substring(lastIndexOf('.'))` without validation, allowing injection of arbitrary characters (e.g., shell metacharacters, null bytes) into filenames constructed for FFmpeg processing.

**Root Cause:** The assumption that file extensions from user input are safe and only contain the format identifier. The code relied on `lastIndexOf` which accidentally mitigated basic `..` traversal (since `..` contains dots) but failed to sanitize other dangerous characters.

**Learning:** Never trust file extensions from user input. Always whitelist or strictly sanitize (alphanumeric only) components used in file system operations.

**Prevention:** Use a strict regex (e.g., `/^\.[a-z0-9]+$/i`) to validate file extensions before using them in `path.join` or shell commands.

**Code:**
```typescript
// Vulnerable:
return fileName.substring(fileName.lastIndexOf('.'));

// Secure:
const ext = fileName.substring(lastDot);
if (/^\.[a-z0-9]+$/i.test(ext)) return ext;
return '';
```
