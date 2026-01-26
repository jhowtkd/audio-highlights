## 2024-05-24 - Input Length Limits to Prevent DoS

**Vulnerability:** Potential Application-Layer DoS and Prompt Injection via unchecked input lengths in API endpoints.

**Root Cause:** Zod validation schemas (`z.string()`) lacked `.max()` constraints in `src/lib/validations.ts`. This allowed potentially infinite strings (e.g., massive `episodeTitle` or `narrativeContext`) to be passed to LLM prompts, which could cause token exhaustion, high costs, or service crashes.

**Learning:** Zod `z.string()` is unbounded by default. Always add `.max()` for user-facing string inputs, especially those used in prompts or resource-intensive operations.

**Prevention:** Enforce length limits on all string inputs in Zod schemas using `.max()`.

**Code:**
```typescript
// Vulnerable
episodeTitle: z.string().optional()

// Secure
episodeTitle: z.string().max(200, "Title too long").optional()
```
