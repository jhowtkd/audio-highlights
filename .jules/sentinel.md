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

## 2026-02-19 - Content Security Policy for FFmpeg WASM

**Vulnerability:** The application was running without a Content Security Policy (CSP), allowing scripts and resources from any origin to be loaded if an XSS vulnerability were to be exploited.

**Root Cause:** The project relies on FFmpeg WASM which loads core files from `unpkg.com` and uses `blob:` URLs for workers, making a strict "default" CSP difficult to implement without breaking functionality.

**Learning:** When using FFmpeg WASM, the CSP must explicitly allow `https://unpkg.com` in `script-src` and `connect-src`, and `blob:` in `worker-src`. Next.js development also requires `'unsafe-inline'` and `'unsafe-eval'`.

**Prevention:** Implement a CSP in `middleware.ts` that whitelists necessary CDNs and `blob:` sources while blocking everything else by default.

**Code:**
```typescript
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com",
  "worker-src 'self' blob:",
  "connect-src 'self' https://unpkg.com",
  // ...
].join('; ');
```
