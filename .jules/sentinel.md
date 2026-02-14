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

## 2026-02-24 - Microservice Input Validation Bypass

**Vulnerability:** The `ffmpeg-service` microservice handled raw JSON parsing for `segments` without validation, allowing attackers to send massive arrays (DoS) or invalid segment data (potential crashes or unexpected behavior) directly to `ffmpeg` spawn commands.

**Root Cause:** The microservice operates independently from the main Next.js application and does not inherit its Zod-based validation layer, leading to a gap where complex inputs were trusted implicitly.

**Learning:** Microservices, even internal ones, must implement their own strict input validation layer. Relying on the "main app" to validate data before sending it to a microservice is insufficient (defense in depth).

**Prevention:** Implement explicit validation logic in microservice endpoints before processing any data, especially before spawning expensive processes like `ffmpeg`. Enforce limits on array lengths and validate object properties types and ranges.

**Code:**
```typescript
// Vulnerable:
parsedSegments = JSON.parse(segments);
// ... proceed to use segments directly

// Secure:
parsedSegments = JSON.parse(segments);
if (parsedSegments.length > MAX_SEGMENTS) throw new Error('Too many segments');
for (const seg of parsedSegments) {
    if (typeof seg.start !== 'number' || typeof seg.end !== 'number' || seg.start < 0 || seg.end <= seg.start) {
        throw new Error('Invalid segment');
    }
}
```
