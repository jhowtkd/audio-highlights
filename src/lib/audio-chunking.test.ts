import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processLargeAudioWithFFmpeg } from './audio-chunking';
import { CHUNK_DURATION_SECONDS } from './constants';

// Mock File and FormData for Node environment
class MockFile {
  name: string;
  size: number;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(parts: any[], name: string, options: any) {
    this.name = name;
    this.type = options?.type || '';
    this.size = 1000;
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.File = MockFile as any;

class MockFormData {
  append() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.FormData = MockFormData as any;

describe('processLargeAudioWithFFmpeg', () => {
  beforeEach(() => {
    // vi.useFakeTimers(); // Removing this to avoid confusion
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should process audio chunks correctly', { timeout: 10000 }, async () => {
    // Setup mocks
    const mockFile = new File([], 'test.mp3', { type: 'audio/mpeg' });
    const projectId = 'test-project';
    const duration = CHUNK_DURATION_SECONDS * 6; // 6 chunks

    // Mock split function
    const splitFn = vi.fn().mockImplementation(async (file, start, dur, index) => {
      // Simulate split time (50ms)
      await new Promise(resolve => setTimeout(resolve, 50));
      return new File([], `chunk_${index}.mp3`, { type: 'audio/mpeg' });
    });

    // Mock fetch for transcription
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockImplementation(async () => {
      // Simulate transcription time (200ms)
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        ok: true,
        json: async () => ({
          transcription: {
            text: 'test transcription',
            segments: [],
            language: 'en'
          }
        })
      };
    });

    const onProgress = vi.fn();

    const startTime = Date.now();
    const result = await processLargeAudioWithFFmpeg(
      mockFile,
      projectId,
      duration,
      splitFn,
      onProgress
    );
    const endTime = Date.now();

    expect(result).toBeDefined();
    expect(splitFn).toHaveBeenCalledTimes(6);
    expect(global.fetch).toHaveBeenCalledTimes(6);

    console.log(`Total time: ${endTime - startTime}ms`);
  });
});
