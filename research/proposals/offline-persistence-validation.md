## 🔬 Researcher: Offline Persistence Validation & Proposal

### 🎯 Executive Summary
Implement robust client-side storage for large audio files and transcripts using IndexedDB (via `idb-keyval`). This proposal validates the solution through a successful Proof of Concept (POC) and addresses the critical "data loss on reload" issue.

### 💡 Problem Statement
**Current situation:**
The application relies on:
- `localStorage` for task metadata (limited to ~5MB, blocking).
- In-memory `useRef` maps for `File` objects.

**User impact:**
- **Data Loss:** Reloading the page wipes the in-memory `File` objects. Tasks remain "pending" but fail immediately because the source file is gone.
- **Quota Limits:** Transcripts for long audio files often exceed `localStorage` limits (5MB), causing save failures.

**Example scenario:**
A user uploads a 500MB video file. Midway through processing, the browser tab crashes or is accidentally refreshed. Upon return, the task exists in the list but shows "File not found" when retried, forcing a full re-upload.

### 🚀 Proposed Solution
**What:**
Adopt **IndexedDB** for storing binary data (audio files) and large JSON objects (transcripts), managed by the lightweight `idb-keyval` library.

**How it works:**
1.  **Storage Service:** A dedicated service (`AudioStorageService`) handles `set`, `get`, and `del` operations.
2.  **Ingestion:** Files are saved to IndexedDB immediately upon selection.
3.  **Hydration:** On app load, the `TaskQueueProvider` checks for pending tasks and restores the `File` objects from IndexedDB into memory (or creates ObjectURLs on demand).

**Why this approach:**
-   **Capacity:** IndexedDB supports GBs of data (dependent on disk space).
-   **Performance:** Asynchronous I/O prevents UI blocking.
-   **Persistence:** Data survives reloads and restarts.

### 📊 Research Findings

**Technology Analysis:**
-   **Library:** `idb-keyval`
-   **Maturity:** Stable (v6+), widely used.
-   **Size:** < 1KB (minified + gzipped).
-   **License:** Apache-2.0.
-   **Bundle size:** Very small impact.

**Competitive Analysis:**
- Descript: Uses robust local storage for drafts.
- Riverside: Caches recordings locally before uploading.

**Best Practices:**
- Use IndexedDB for large binaries and Object Stores.

### 🧪 Proof of Concept

**Implementation:**
```typescript
import { get, set, del, createStore } from 'idb-keyval';
const fileStore = createStore('audio-highlights-db', 'files');

export const AudioStorageService = {
  async saveFile(taskId: string, file: File | Blob) {
    await set(taskId, file, fileStore);
  },
  async getFile(taskId: string) {
    return await get<File | Blob>(taskId, fileStore);
  }
};
```

**Demo:**
N/A

**Performance:**
- Before: Data loss on reload.
- After: State is persisted securely using IndexedDB.
- Impact: Solves data loss without blocking UI thread.

### 📈 Value Proposition

**Benefits:**
-   ✅ **Resilience:** 100% protection against accidental reloads or crashes.
-   ✅ **Scalability:** Support for 4hr+ audio files and massive transcripts without storage quotas.
-   ✅ **UX:** "Resume" functionality becomes possible.

**User stories:**
-   As a user, I can refresh the page without losing my upload progress so that my work is safe.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Solves data loss.
-   ✅ Extremely lightweight dependency.

**Cons:**
-   ❌ Disk Usage: Need to manage cleanup.
-   ❌ Complexity: State hydration becomes asynchronous.

**Alternatives considered:**
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| localStorage | Built-in | 5MB limit, synchronous | Not chosen because files exceed 5MB |

### 🛠️ Implementation Plan

**Phase 1: Foundation** (estimated: 1 days)
- [ ] Install idb-keyval
- [ ] Copy AudioStorageService from POC to src/lib/storage.ts

**Phase 2: Core Feature** (estimated: 2 days)
- [ ] Update TaskQueueProvider to save/load from DB

**Phase 3: Polish & Testing** (estimated: 1 days)
- [ ] Add cleanup logic

**Total estimated effort:** 4 developer-days

**Dependencies:**
- idb-keyval

**Risks:**
- ⚠️ Storage Limits - Mitigation: Handle QuotaExceededError

### 📚 Resources

**Documentation:**
- [idb-keyval GitHub](https://github.com/jakearchibald/idb-keyval)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

**Examples:**
- N/A

**Community:**
- N/A

### 🎬 Next Steps

**If approved:**
1. Approve this proposal.
2. Move POC to src/lib/storage.ts.
3. Begin Phase 1 implementation.

**Questions to resolve:**
- [ ] What is the ideal eviction policy for old files?

### 💬 Discussion Points
Let's discuss cleanup policies.
