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
    const duration = CHUNK_DURATION_SECONDS * 2; // 2 chunks

    // Mock split function
    const splitFn = vi.fn().mockImplementation(async (file, start, dur, index) => {
      // Simulate split time (50ms)
      await new Promise(resolve => setTimeout(resolve, 50));
      return new File([], `chunk_${index}.mp3`, { type: 'audio/mpeg' });
    });

    // Mock fetch for transcription
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockImplementation(async () => {
      // Simulate transcription time (100ms)
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        ok: true,
        text: async () => JSON.stringify({
          transcription: {
            text: 'test transcription',
            segments: [
              {
                start: 0,
                end: 10,
                text: 'segment text',
                words: [
                  { start: 0, end: 5, word: 'segment' },
                  { start: 5, end: 10, word: 'text' }
                ]
              }
            ],
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
    expect(splitFn).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledTimes(2);

    // Check segments count
    expect(result.segments).toHaveLength(2);

    // Check first chunk segment (no offset)
    const seg0 = result.segments[0];
    expect(seg0.start).toBe(0);
    expect(seg0.end).toBe(10);
    expect(seg0.words![0].start).toBe(0);

    // Check second chunk segment (offset by CHUNK_DURATION_SECONDS)
    const seg1 = result.segments[1];
    expect(seg1.start).toBe(CHUNK_DURATION_SECONDS);
    expect(seg1.end).toBe(CHUNK_DURATION_SECONDS + 10);
    expect(seg1.words![0].start).toBe(CHUNK_DURATION_SECONDS);

    console.log(`Total time: ${endTime - startTime}ms`);
  });
});
