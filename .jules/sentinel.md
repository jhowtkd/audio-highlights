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

## 2026-07-03 - Missing Security HTTP Headers

**Vulnerability:** The Next.js application was missing standard security HTTP headers (e.g., `X-Content-Type-Options`, `X-Frame-Options`), leaving it susceptible to attacks like Clickjacking, MIME-type sniffing, and cross-site scripting (XSS), as well as missing strict transport security (HSTS).
**Root Cause:** Security headers were commented out in `next.config.ts`, possibly during initial development.
**Learning:** Always enable HTTP security headers globally at the application level to provide defense in depth. Frameworks like Next.js make this trivial via `next.config.ts`.
**Prevention:** Ensure `next.config.ts` configures `async headers()` to apply security headers to all routes `/(.*)`.
**Code:**
```typescript
// Vulnerable:
// async headers() { ... }

// Secure:
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        // ... other security headers
      ],
    },
  ];
}
```
