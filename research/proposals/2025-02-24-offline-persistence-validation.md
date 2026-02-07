## 🔬 Researcher: Offline Persistence Validation & Implementation Plan

### 🎯 Executive Summary
Validates the feasibility of client-side audio persistence using **IndexedDB**. A Proof of Concept (POC) confirmed that large audio files can be saved, persist across page reloads, and be retrieved successfully. The recommendation is to proceed with **`idb-keyval`** to simplify the implementation and solve the critical data loss issue.

### 💡 Problem Statement
**Current situation:**
- Audio files are stored in-memory (`useRef`) within `TaskQueueContext`.
- **Data Loss:** Reloading the page clears the memory, causing all pending/processing tasks to fail because the source file is lost.
- **UX Impact:** Users lose their upload progress and must restart if the browser crashes or tab refreshes.

**Validation:**
- Verified that `localStorage` is insufficient (5MB limit) for audio files.
- Confirmed that `TaskQueueContext` does not persist `File` objects.

### 🚀 Proposed Solution
**What:**
Implement a persistence layer using **IndexedDB** wrapped by **`idb-keyval`**.

**How it works:**
1.  **Storage:** When a file is uploaded, it is immediately saved to IndexedDB (key: `taskId`).
2.  **Hydration:** On app load, the app checks for pending tasks in `localStorage` and attempts to retrieve the corresponding file from IndexedDB.
3.  **Cleanup:** Files are deleted from IndexedDB when the task completes or is removed.

**Why this approach:**
- **Feasibility:** Verified via POC that IndexedDB handles Blob/File storage natively.
- **Performance:** Async operations prevent UI blocking.
- **Simplicity:** `idb-keyval` (tested in previous research) offers a simple Key-Value API (< 1KB).

### 📊 Research Findings

**POC Results:**
- **Implementation:** Built a native `IndexedDB` wrapper (no dependencies) to verify behavior in `research/pocs/idb-poc-component.tsx`.
- **Outcome:** Successfully saved a test file, reloaded the page, and retrieved/played it.
- **Performance:** Instant save/load for small files. Large files (100MB+) handled asynchronously without main thread freeze.
- **Screenshot:** Generated screenshot proving the flow.
  ![IDB Verification](/research/idb-poc.png)

**Technology Analysis:**
- **Native IndexedDB:** Powerful but verbose (requires opening DB, handling transactions, events, upgrades).
- **`idb-keyval`:** Abstraction that simplifies ~50 lines of native code to 3 lines (`get`, `set`, `del`).
- **Recommendation:** Use `idb-keyval` to maintain code cleanliness.

### 🧪 Proof of Concept

**Native Implementation (for reference):**
See `research/pocs/idb-service.ts` for the raw IndexedDB implementation used in verification.

```typescript
// excerpt from archived POC
async saveFile(key: string, file: File): Promise<void> {
  const db = await this.openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const request = store.put(file, key);
    // ... handling events
  });
}
```

**Proposed Implementation (using `idb-keyval`):**
```typescript
import { set } from 'idb-keyval';
await set(taskId, file);
```

### 📈 Value Proposition

**Benefits:**
- ✅ **Zero Data Loss:** Users can refresh safely.
- ✅ **Crash Recovery:** Tasks resume automatically.
- ✅ **Better UX:** Robust feeling application.

### ⚖️ Trade-offs

**Pros:**
- ✅ Solves the #1 reliability issue.
- ✅ Minimal bundle size impact (`idb-keyval` is tiny).

**Cons:**
- ❌ **Storage Quota:** Browsers enforce storage limits (usually % of disk space). We must handle `QuotaExceededError` gracefully.

### 🛠️ Implementation Plan

**Phase 1: Foundation** (1 day)
- [ ] Install `idb-keyval`.
- [ ] Create `src/lib/storage.ts` service.

**Phase 2: Integration** (1-2 days)
- [ ] Update `TaskQueueContext` to save files on `addTask`.
- [ ] Implement hydration logic in `TaskQueueProvider`.
- [ ] Add cleanup logic in `removeTask`/`completeTask`.

**Dependencies:**
- `idb-keyval` (npm install idb-keyval)

### 📚 Resources

- [MDN IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [idb-keyval](https://github.com/jakearchibald/idb-keyval)

### 🎬 Next Steps

1.  Approve this proposal.
2.  Install `idb-keyval`.
3.  Execute Implementation Plan.
