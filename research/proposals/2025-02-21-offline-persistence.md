## 🔬 Researcher: Offline Persistence with IndexedDB

### 🎯 Executive Summary
Implement robust client-side storage using **IndexedDB** to persist source audio files and large transcriptions. This addresses the critical data loss issue where reloading the page (or a browser crash) wipes out the in-memory `File` objects, forcing users to re-upload and restart processing.

### 💡 Problem Statement
**Current situation:**
The application uses `localStorage` for task metadata (stored in `src/contexts/task-context.tsx`) but stores the actual audio `File` objects in an in-memory `useRef<Map<string, File>>`.

**User impact:**
- **Data Loss:** If the user refreshes the page, the task metadata persists (status: "pending"), but the underlying file is lost.
- **Broken Workflow:** Attempting to "Retry" or process the pending task fails with "File not found" because `filesRef` is empty on reload.
- **Storage Limits:** `localStorage` is capped at ~5MB, which is risky for storing full transcription JSONs for long episodes.

**Example scenario:**
1. User uploads a 500MB video file.
2. Transcription is 50% complete.
3. Browser crashes or user accidentally refreshes.
4. User returns: Task is listed as "Pending", but clicking "Resume" fails immediately because the 500MB Blob is gone.

### 🚀 Proposed Solution
**What:**
Integrate the `idb` library to interact with IndexedDB. Store source files (Blobs) and eventually large results in a structured database.

**How it works:**
1.  **Storage Layer:** Create `src/lib/db.ts` to manage the `audio-highlights-db`.
2.  **Task Creation:** When a file is added, save it immediately to IndexedDB `files` store using the `taskId` as key.
3.  **Hydration:** On page load, `TaskQueueProvider` initializes. `getTaskFile(id)` becomes an async lookup in IndexedDB.
4.  **Cleanup:** Implement a simple cleanup strategy (e.g., delete file when task is removed).

**Why this approach:**
- **IndexedDB** handles large binary data (Blobs) natively.
- **Async & Non-blocking:** Doesn't freeze the UI during large writes.
- **Persistent:** Survives reloads and browser restarts.

### 📊 Research Findings

**Technology Analysis:**
- **Library:** `idb` (v8.0.0)
- **Maturity:** Standard wrapper by Google Chrome team.
- **Size:** ~200 bytes (gzipped).
- **Compatibility:** Works in all modern browsers.

**POC Verification:**
A Proof of Concept was created at `public/research/offline-storage-poc.html` and verified using Playwright (`verify_storage_poc.py`).
- **Result:** Successfully stored a Blob, reloaded the page, and retrieved the Blob.
- **Performance:** Instantaneous for text blobs; handles large files efficiently as references.

### 🧪 Proof of Concept

**POC Artifact:** `public/research/offline-storage-poc.html`

**Proposed Implementation (`src/lib/db.ts`):**

```typescript
import { openDB, type DBSchema } from 'idb';

interface AudioHighlightsDB extends DBSchema {
  files: {
    key: string; // taskId
    value: { file: File | Blob; filename: string; type: string; createdAt: number };
  };
}

const DB_NAME = 'audio-highlights-db';
const DB_VERSION = 1;

export async function getDB() {
  return openDB<AudioHighlightsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    },
  });
}

export async function saveTaskFile(taskId: string, file: File) {
  const db = await getDB();
  await db.put('files', {
    file,
    filename: file.name,
    type: file.type,
    createdAt: Date.now(),
  }, taskId);
}

export async function getTaskFile(taskId: string): Promise<File | undefined> {
  const db = await getDB();
  const record = await db.get('files', taskId);
  if (!record) return undefined;

  // Reconstruct File object if needed (IDB stores Blobs well, File metadata is helpful)
  if (record.file instanceof File) return record.file;
  return new File([record.file], record.filename, { type: record.type });
}

export async function deleteTaskFile(taskId: string) {
  const db = await getDB();
  await db.delete('files', taskId);
}
```

### 📈 Value Proposition

**Benefits:**
- ✅ **Zero Data Loss:** Users can resume work anytime.
- ✅ **Large File Support:** No 5MB `localStorage` limit.
- ✅ **Professional UX:** Behaves like a native desktop application.

**User stories:**
- As a user, I can refresh the page to fix a UI glitch without losing my 30-minute upload.

### ⚖️ Trade-offs

**Pros:**
- Robust persistence.
- Standard web API.

**Cons:**
- Requires making `getTaskFile` async, which might ripple through `useTaskQueue` (though mostly manageable).
- Disk space usage (browser may evict if storage pressure is high, but unlikely for this app's scale).

### 🛠️ Implementation Plan

**Phase 1: Setup** (0.5 day)
- [ ] `npm install idb`
- [ ] Create `src/lib/db.ts`

**Phase 2: Integration** (1 day)
- [ ] Modify `src/contexts/task-context.tsx`:
    -   Replace `filesRef` with DB calls.
    -   Update `addTask` to `await saveTaskFile`.
    -   Update `getTaskFile` to return `Promise<File | undefined>`.
- [ ] Modify `useTaskQueue.ts` to handle async `getTaskFile`.

**Phase 3: Cleanup** (0.5 day)
- [ ] Ensure `deleteTaskFile` is called when a task is removed via UI.

**Total estimated effort:** 2 developer-days

### 📚 Resources
- [idb on GitHub](https://github.com/jakearchibald/idb)
- [MDN IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
