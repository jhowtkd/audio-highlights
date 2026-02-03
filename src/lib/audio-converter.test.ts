import { describe, it, expect, vi, afterEach } from 'vitest';
import { convertToMp3 } from './audio-converter';
import { writeFile } from 'fs/promises';

// Mock fs/promises
vi.mock('fs/promises', () => {
  return {
    writeFile: vi.fn(),
    unlink: vi.fn(),
    readFile: vi.fn().mockResolvedValue(Buffer.from('mock data')),
  };
});

// Mock fluent-ffmpeg
vi.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = () => ({
    audioCodec: vi.fn().mockReturnThis(),
    audioBitrate: vi.fn().mockReturnThis(),
    audioChannels: vi.fn().mockReturnThis(),
    audioFrequency: vi.fn().mockReturnThis(),
    format: vi.fn().mockReturnThis(),
    on: vi.fn().mockImplementation(function(this: any, event, cb) {
      if (event === 'end') {
        setTimeout(cb, 0);
      }
      return this;
    }),
    save: vi.fn(),
  });

  mockFfmpeg.setFfmpegPath = vi.fn();

  return {
    default: mockFfmpeg,
  };
});

vi.mock('ffmpeg-static', () => ({ default: '/usr/bin/ffmpeg' }));

describe('Security: convertToMp3 Input Sanitization', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should sanitize file extension to prevent injection of special characters', async () => {
    // Input with shell metacharacters and path traversal attempts
    const unsafeName = 'test.m4a;rm -rf /';

    const mockFile = {
      name: unsafeName,
      arrayBuffer: async () => new ArrayBuffer(10),
      size: 10,
      type: 'audio/mp4',
    } as unknown as File;

    await convertToMp3(mockFile);

    const writeFileMock = writeFile as unknown as ReturnType<typeof vi.fn>;
    expect(writeFileMock).toHaveBeenCalled();

    const writeCall = writeFileMock.mock.calls[0];
    const writePath = writeCall[0] as string;

    console.log('[TEST] Input Name:', unsafeName);
    console.log('[TEST] Write Path:', writePath);

    // Check if the write path still contains the dangerous characters
    const isSanitized = !writePath.includes(';') && !writePath.includes(' ');

    if (!isSanitized) {
        throw new Error(`Filename not sanitized! Path contains dangerous chars: ${writePath}`);
    }
  });
});
