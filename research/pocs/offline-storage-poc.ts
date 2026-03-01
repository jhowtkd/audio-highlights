import { get, set, del, createStore } from 'idb-keyval';

// Initialize a custom store
const DB_NAME = 'audio-highlights-db';
const STORE_NAME = 'files';
const fileStore = createStore(DB_NAME, STORE_NAME);

export const AudioStorageService = {
  /**
   * Save an audio file to IndexedDB
   */
  async saveFile(taskId: string, file: File | Blob): Promise<void> {
    try {
      await set(taskId, file, fileStore);
      console.log(`[Storage] Saved file for task ${taskId}`);
    } catch (error) {
      console.error('[Storage] Failed to save file:', error);
      throw new Error('Failed to persist audio file');
    }
  },

  /**
   * Retrieve an audio file by Task ID
   */
  async getFile(taskId: string): Promise<File | Blob | undefined> {
    try {
      const file = await get<File | Blob>(taskId, fileStore);
      if (file) {
        console.log(`[Storage] Retrieved file for task ${taskId}`);
      }
      return file;
    } catch (error) {
      console.error('[Storage] Failed to get file:', error);
      return undefined;
    }
  },

  /**
   * Delete an audio file
   */
  async deleteFile(taskId: string): Promise<void> {
    try {
      await del(taskId, fileStore);
      console.log(`[Storage] Deleted file for task ${taskId}`);
    } catch (error) {
      console.error('[Storage] Failed to delete file:', error);
    }
  },

  /**
   * Check if a file exists (optimization)
   */
  async hasFile(taskId: string): Promise<boolean> {
    const file = await this.getFile(taskId);
    return !!file;
  }
};
