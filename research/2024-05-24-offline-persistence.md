## 🔬 Researcher: Offline Persistence & Large File Support

### 🎯 Executive Summary
Implement robust client-side storage using **IndexedDB** to persist audio files and large transcriptions. This will prevent data loss on page reloads, enable "resume" functionality for interrupted tasks, and bypass `localStorage` size limits (5MB) which are insufficient for long audio transcripts.

### 💡 Problem Statement
**Current situation:**
The application currently stores task metadata in `localStorage` but keeps audio `File` objects in memory (`useRef`). It also attempts to cache transcriptions in `localStorage`.

**User impact:**
- **Data Loss on Reload:** If a user accidentally refreshes the page or the browser crashes, the "pending" task remains in `localStorage`, but the actual audio file is lost from memory. The user sees a task that fails with "File not found" and must re-upload.
- **Storage Limits:** `localStorage` is limited to ~5MB. A long podcast transcription (JSON) can easily exceed this, causing the application to crash or fail to save progress.

**Example scenario:**
1. User uploads a 2-hour podcast (100MB).
2. Transcribing reaches 80%.
3. User accidentally closes the tab or browser crashes.
4. User re-opens app. Task says "Pending", but clicking "Retry" fails because the 100MB file is gone.

### 🚀 Proposed Solution
**What:**
Introduce an IndexedDB adapter (using `idb` library) to store:
1.  **Source Files:** The raw `File`/`Blob` objects associated with tasks.
2.  **Task Data:** Full task objects including large transcription results.

**How it works:**
- When a file is dropped, it is immediately saved to IndexedDB's `files` store.
- The `TaskQueueContext` will hydrate from IndexedDB instead of `localStorage`.
- `localStorage` can still be used for lightweight preferences (theme, UI settings).

**Why this approach:**
- **IndexedDB** is designed for large binary data (Blobs) and structured data.
- **Async API** prevents blocking the main thread (unlike `localStorage`).
- **Persistence** ensures the app behaves like a desktop tool—work is safe until explicitly deleted.

### 📊 Research Findings

**Technology Analysis:**
- **Library:** `idb` (v8.0.0)
- **Maturity:** Stable (Standard wrapper by Google Chrome team)
- **Adoption:** Used in most PWA that require storage (e.g., Squoosh, Google Photos web)
- **Community:** 6.5k stars, 10m weekly downloads
- **License:** ISC
- **Bundle size:** ~200 bytes (extremely small)

**Competitive Analysis:**
- **Descript (Web):** Persists all assets locally/cloud immediately.
- **Adobe Podcast:** Uploads to cloud, but maintains local cache for resilience.
- **Current App:** Relies on volatile memory for files.

**Best Practices:**
- "Offline First" architecture.
- Store large assets in IndexedDB, small config in LocalStorage.

### 🧪 Proof of Concept

**Implementation:**
The following utility demonstrates the type-safe interface for managing files and tasks.

```typescript
import { openDB, type DBSchema } from 'idb';
import type { Task } from '@/types/task-types';

interface AudioHighlightsDB extends DBSchema {
  files: {
    key: string; // taskId
    value: { file: File | Blob; filename: string; type: string; createdAt: number };
  };
  tasks: {
    key: string; // taskId
    value: Task;
  };
}

const DB_NAME = 'audio-highlights-db';

export async function getDB() {
  return openDB<AudioHighlightsDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
      if (!db.objectStoreNames.contains('tasks')) db.createObjectStore('tasks', { keyPath: 'id' });
    },
  });
}

// Save file immediately on upload
export async function saveTaskFile(taskId: string, file: File) {
  const db = await getDB();
  await db.put('files', {
    file,
    filename: file.name,
    type: file.type,
    createdAt: Date.now(),
  }, taskId);
}

// Restore file on page load
export async function getTaskFile(taskId: string): Promise<File | undefined> {
  const db = await getDB();
  const record = await db.get('files', taskId);
  if (!record) return undefined;
  return record.file instanceof File ? record.file : new File([record.file], record.filename, { type: record.type });
}
```

### 📈 Value Proposition

**Benefits:**
- ✅ **Resilience:** Users never lose their upload/transcription state.
- ✅ **Scalability:** Supports unlimited file sizes and transcript lengths (up to disk space).
- ✅ **Performance:** Offloads large JSON parsing/stringifying from the main thread (localStorage is synchronous and blocking).

**User stories:**
- As a Podcaster, I can close my browser while a transcription is queued and resume it later without re-uploading the 500MB file.
- As a Power User, I can work on multiple 3-hour episodes without hitting storage quota errors.

### ⚖️ Trade-offs

**Pros:**
- ✅ Solves the critical "data loss" issue.
- ✅ Standard browser API (no backend required).
- ✅ Minimal bundle size impact.

**Cons:**
- ❌ Asynchronous API adds slight complexity to state management (need to handle loading states).
- ❌ Storage cleanup strategy needed (e.g., auto-delete after 7 days) to prevent disk bloat.

### 🛠️ Implementation Plan

**Phase 1: Foundation** (1 day)
- [ ] Install `idb`.
- [ ] Create `src/lib/db.ts` adapter.
- [ ] Implement cleanup logic (LRU or time-based).

**Phase 2: Integration** (1-2 days)
- [ ] Update `TaskQueueContext` to read/write to DB.
- [ ] Replace `filesRef` (Map) with async DB calls.
- [ ] Add loading indicators during hydration.

**Phase 3: Migration & Polish** (1 day)
- [ ] Migration script to clear old `localStorage` data.
- [ ] Add UI toast "Draft saved to device".

**Total estimated effort:** 3-4 developer-days

### 🎬 Next Steps

**If approved:**
1. Install `idb`.
2. Create the DB adapter.
3. Refactor `useTaskQueue`.
