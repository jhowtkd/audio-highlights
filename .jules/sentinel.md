## 2024-05-26 - Missing Input Length Validation in Zod Schemas

**Vulnerability:** The application accepted unbounded string inputs in JSON payloads for API endpoints processing transcription segments (e.g., `text` and `word` fields).

**Root Cause:** While array size limits were enforced (`MAX_SEGMENTS_COUNT`), individual string fields within those arrays lacked explicit `.max()` constraints in their Zod schemas, leaving them vulnerable to massive payloads.

**Learning:** Always apply maximum length limits to string inputs in Zod validation schemas, especially those parsing JSON payloads. Unbounded strings can lead to Denial of Service (DoS) attacks via memory exhaustion, CPU spikes during parsing, or excessive API costs when forwarded to LLM providers.

**Prevention:** Ensure that every `z.string()` definition intended for user input includes a `.max()` constraint referencing a globally defined constant.

**Code:**
```typescript
// Vulnerable
text: z.string()

// Secure
text: z.string().max(MAX_SEGMENT_TEXT_LENGTH)
```
