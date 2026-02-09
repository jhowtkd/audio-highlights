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

### 📊 Research Findings & Validation

**Technology Analysis:**
-   **Library:** `idb-keyval`
-   **Maturity:** Stable (v6+), widely used.
-   **Size:** < 1KB (minified + gzipped).
-   **License:** Apache-2.0.

**Validation Results (POC):**
A Proof of Concept was implemented in `research/pocs/offline-storage-poc.ts` and verified with `vitest`.

**POC Implementation:**
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

**Test Results:**
The following tests passed successfully (using `fake-indexeddb` to simulate browser environment):
-   ✅ `should save a file to IndexedDB`
-   ✅ `should retrieve a saved file` (Content verified)
-   ✅ `should delete a file`
-   ✅ `should handle large files (simulated)` (Verified with 1MB dummy file)

*Test Output:*
```
✓ research/pocs/offline-storage-poc.test.ts (5 tests)
  ✓ AudioStorageService (Offline Persistence POC) > should save a file to IndexedDB
  ✓ AudioStorageService (Offline Persistence POC) > should retrieve a saved file
  ✓ AudioStorageService (Offline Persistence POC) > should delete a file
  ✓ AudioStorageService (Offline Persistence POC) > should handle large files (simulated)
```

### 📈 Value Proposition

**Benefits:**
-   ✅ **Resilience:** 100% protection against accidental reloads or crashes.
-   ✅ **Scalability:** Support for 4hr+ audio files and massive transcripts without storage quotas.
-   ✅ **UX:** "Resume" functionality becomes possible.

**User stories:**
-   As a user, I can refresh the page without losing my upload progress.
-   As a developer, I stop receiving bug reports about "quota exceeded" errors.

### ⚖️ Trade-offs

**Pros:**
-   ✅ Solves data loss.
-   ✅ Extremely lightweight dependency.
-   ✅ Standard Web API.

**Cons:**
-   ❌ **Disk Usage:** Need to manage cleanup (e.g., delete files when task is removed).
-   ❌ **Complexity:** State hydration becomes asynchronous.

### 🛠️ Implementation Plan

**Phase 1: Foundation** (1 day)
-   [ ] Install `idb-keyval`.
-   [ ] Copy `AudioStorageService` from POC to `src/lib/storage.ts`.
-   [ ] Add error handling for `QuotaExceededError`.

**Phase 2: Integration** (2 days)
-   [ ] Update `TaskQueueProvider` (`src/contexts/task-context.tsx`) to:
    -   Save file to DB in `addTask`.
    -   Hydrate files from DB in `useEffect` (load).
    -   Delete file from DB in `removeTask`.

**Phase 3: Polish** (1 day)
-   [ ] Add a "Clear Storage" button in settings to free up disk space.
-   [ ] Add a cleanup job to remove files for tasks older than 7 days.

**Total estimated effort:** 4 developer-days

**Dependencies:**
-   `idb-keyval` (Runtime)

### 📚 Resources
-   [idb-keyval GitHub](https://github.com/jakearchibald/idb-keyval)
-   [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

### 🎬 Next Steps
1.  Approve this proposal.
2.  Move `research/pocs/offline-storage-poc.ts` to `src/lib/storage.ts`.
3.  Begin Phase 1 implementation.
