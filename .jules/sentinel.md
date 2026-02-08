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

## 2025-02-25 - Security Gaps in Microservices

**Vulnerability:** The `ffmpeg-service` microservice lacked standard security headers (like `X-Powered-By` suppression) and input validation for critical JSON payloads (`segments`), unlike the main Next.js application which is protected by `middleware.ts`.

**Root Cause:** The microservice is a standalone Express application in a subdirectory with its own configuration, completely bypassing the main application's security middleware and linting rules (it was ignored in `eslint.config.mjs`).

**Learning:** Security controls implemented in the main application (Next.js middleware) do not propagate to auxiliary microservices. Each microservice requires its own independent security hardening (headers, validation, auth).

**Prevention:**
- Audit all microservices (`ffmpeg-service`, etc.) for security headers and input validation.
- Consider creating a shared security configuration or middleware for Express-based microservices.
- Ensure linting/security scanning covers all subdirectories, not just the main `src`.
