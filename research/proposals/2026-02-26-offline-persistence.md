
## 🔬 Researcher: Robust Offline Persistence with IndexedDB

### 🎯 Executive Summary
Implementation of robust client-side storage for large audio files using IndexedDB (`idb-keyval`). This solves the critical issue where reloading the page causes data loss (requiring re-upload) and enables true offline capability for the application.

### 💡 Problem Statement
**Current situation:**
- The application relies on `localStorage` for task metadata and in-memory variables (`File` objects) for audio data.
- `localStorage` has a strict quota (~5MB), making it unsuitable for storing audio files or large transcripts.
- **Critical Pain Point:** If a user reloads the page (or the browser crashes) during or after processing, the source audio file is lost from memory, and the task becomes invalid/unusable without re-uploading.

**User impact:**
- Users lose work if they accidentally close the tab.
- Users cannot return to a project later without re-uploading the original file.
- Poor experience on mobile/unstable connections.

### 🚀 Proposed Solution
**What:**
- Integrate `idb-keyval` to store audio files (Blobs) in IndexedDB.
- Modify the Task Queue system to save files to IndexedDB immediately upon upload.
- Implement "hydration" logic to restore files from IndexedDB into memory when the application loads.

**How it works:**
1. **Storage Service (`src/lib/storage.ts`):** A lightweight wrapper around `idb-keyval` to managing saving/retrieving blobs by Task ID.
2. **Task Context (`src/contexts/task-context.tsx`):**
   - On `addTask`: Save file to IndexedDB asynchronously.
   - On `getTaskFile`: If file is missing in memory (e.g., after reload), fetch from IndexedDB.
   - On `removeTask`: Clean up the file from IndexedDB.

**Why this approach:**
- **IndexedDB** is the standard browser API for storing large binary data (Blobs).
- **idb-keyval** provides a simple Promise-based API (< 1kb) without the complexity of raw IndexedDB.
- Decouples metadata (localStorage) from heavy data (IndexedDB) for optimal performance.

### 📊 Research Findings

**Technology Analysis:**
- **Library:** `idb-keyval` (v6.x)
- **Maturity:** Stable, widely used (Weekly downloads: ~2M).
- **Size:** Tiny (~600 bytes gzip).
- **Browser Support:** Excellent (All modern browsers).

**Competitive Analysis:**
- **Descript / Riverside:** Use local caching to prevent data loss during upload/processing.
- **Web-based Editors (Figma, VS Code Web):** Heavily rely on IndexedDB for offline resilience.

### 🧪 Proof of Concept

**Implementation:**
The implementation was successfully verified with a test page (`src/app/verify-storage`) and automated Playwright scripts.

**Verification Results:**
- **Persistence:** Files saved to IDB persist across page reloads.
- **Performance:** Saving 50MB+ files is non-blocking (async).
- **Recovery:** Tasks successfully recover their file references after a simulated crash/reload.

### 📈 Value Proposition

**Benefits:**
- ✅ **Zero Data Loss:** Users can refresh safely.
- ✅ **Offline Resume:** Work on existing projects without internet.
- ✅ **Better UX:** Instant project loading without re-upload steps.

### ⚖️ Trade-offs

**Pros:**
- Robustness and reliability.
- Minimal bundle size impact.
- Standard web platform API.

**Cons:**
- **Storage Limits:** Browsers may evict IndexedDB data if disk space is low (though usually prompts user).
- **Complexity:** Async file retrieval requires handling loading states in UI (handled via Context).

### 🛠️ Implementation Plan

**Phase 1: Foundation (Completed)**
- [x] Install `idb-keyval`.
- [x] Create `src/lib/storage.ts` service.
- [x] Verify basic storage operations.

**Phase 2: Integration (Completed)**
- [x] Update `TaskQueueContext` to use storage service.
- [x] Implement file hydration in `useTaskQueue`.
- [x] Verify persistence with automated tests.

**Phase 3: Cleanup (Next Steps)**
- [ ] Remove verification pages (`src/app/verify-storage`).
- [ ] Add UI indicators for "Offline Ready" projects (optional).

### 📚 Resources
- [idb-keyval GitHub](https://github.com/jakearchibald/idb-keyval)
- [MDN IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
