import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { get, set, del } from 'idb-keyval';

// Define the service (re-implementing the core logic here to verify idb-keyval behavior
// or I can import the module if I exported it correctly)
import { AudioStorageService } from './offline-storage-poc';

// Mock File/Blob environment if needed (Node has Blob, File might be missing or limited)
if (typeof File === 'undefined') {
  // Simple polyfill for File if missing in Node environment
  global.File = class File extends Blob {
    name: string;
    lastModified: number;
    constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options?.lastModified || Date.now();
    }
  } as any;
}

describe('AudioStorageService (Offline Persistence POC)', () => {
  const taskId = 'task-123';
  const testFile = new File(['test audio content'], 'test-audio.mp3', { type: 'audio/mpeg' });

  beforeEach(async () => {
    // Clear storage before each test
    await del(taskId);
  });

  afterEach(async () => {
    await del(taskId);
  });

  it('should save a file to IndexedDB', async () => {
    await AudioStorageService.saveFile(taskId, testFile);

    // Verify directly with idb-keyval
    const stored = await AudioStorageService.getFile(taskId);
    expect(stored).toBeDefined();
    expect(stored).toBeInstanceOf(Blob); // File inherits from Blob

    if (stored instanceof File) {
      expect(stored.name).toBe('test-audio.mp3');
      expect(stored.size).toBe(testFile.size);
    }
  });

  it('should retrieve a saved file', async () => {
    await AudioStorageService.saveFile(taskId, testFile);
    const retrieved = await AudioStorageService.getFile(taskId);

    expect(retrieved).toBeDefined();
    expect(retrieved?.size).toBe(testFile.size);

    // Check content
    const text = await retrieved?.text();
    expect(text).toBe('test audio content');
  });

  it('should return undefined for non-existent file', async () => {
    const retrieved = await AudioStorageService.getFile('non-existent-task');
    expect(retrieved).toBeUndefined();
  });

  it('should delete a file', async () => {
    await AudioStorageService.saveFile(taskId, testFile);
    await AudioStorageService.deleteFile(taskId);

    const retrieved = await AudioStorageService.getFile(taskId);
    expect(retrieved).toBeUndefined();
  });

  it('should handle large files (simulated)', async () => {
    // Create a larger file (e.g. 1MB)
    const largeContent = new Uint8Array(1024 * 1024).fill(0);
    const largeFile = new File([largeContent], 'large.wav', { type: 'audio/wav' });

    await AudioStorageService.saveFile(taskId, largeFile);
    const retrieved = await AudioStorageService.getFile(taskId);

    expect(retrieved).toBeDefined();
    expect(retrieved?.size).toBe(1024 * 1024);
  });
});
