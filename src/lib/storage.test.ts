
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveAudioFile, getAudioFile, deleteAudioFile } from './storage';
import * as idb from 'idb-keyval';

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
}));

describe('Storage Service', () => {
  const mockId = 'test-id';
  const mockBlob = new Blob(['test content'], { type: 'text/plain' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save audio file', async () => {
    await saveAudioFile(mockId, mockBlob);
    expect(idb.set).toHaveBeenCalledWith(`audio-${mockId}`, mockBlob);
  });

  it('should get audio file', async () => {
    vi.mocked(idb.get).mockResolvedValue(mockBlob);
    const result = await getAudioFile(mockId);
    expect(idb.get).toHaveBeenCalledWith(`audio-${mockId}`);
    expect(result).toBe(mockBlob);
  });

  it('should delete audio file', async () => {
    await deleteAudioFile(mockId);
    expect(idb.del).toHaveBeenCalledWith(`audio-${mockId}`);
  });
});
