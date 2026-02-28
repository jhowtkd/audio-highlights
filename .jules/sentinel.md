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

## 2026-02-28 - Missing Security Headers in FFmpeg Microservice

**Vulnerability:** The `ffmpeg-service` lacked fundamental HTTP security headers, leaving it exposed to basic web vulnerabilities like clickjacking, MIME-sniffing, and XSS.

**Root Cause:** The express app was created quickly as a microservice and standard security middlewares were not included during the initial setup.

**Learning:** Every express application, no matter how small or specific its purpose, should include baseline security headers via a package like `helmet`.

**Prevention:** Make adding `helmet` to the middleware stack a standard step when creating any new Express server.

**Code:**
```typescript
// Secure pattern to use:
import helmet from 'helmet';
const app = express();
app.use(helmet());
```
