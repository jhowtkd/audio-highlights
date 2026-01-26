import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { MAX_FILE_SIZE, ERROR_MESSAGES } from '@/lib/constants';

// Mock other dependencies to avoid side effects
vi.mock('@/lib/groq-client', () => ({
  getGroqClient: vi.fn(),
  GROQ_WHISPER_MODEL: 'whisper-large-v3'
}));

vi.mock('@/lib/audio-converter', () => ({
  needsConversion: vi.fn().mockReturnValue(false),
  convertToMp3: vi.fn()
}));

vi.mock('@/lib/transcription-utils', () => ({
  alignWordsToSegments: vi.fn()
}));

describe('Transcribe API', () => {
  it('should reject files larger than MAX_FILE_SIZE', async () => {
    // Create a mock file larger than MAX_FILE_SIZE
    const largeSize = MAX_FILE_SIZE + 1024;
    const file = {
      name: 'large.mp3',
      type: 'audio/mpeg',
      size: largeSize,
      // We don't need actual content for this check
    };

    // Mock NextRequest with formData method
    const req = new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
    });

    // Mocking formData() on the request object
    req.formData = vi.fn().mockResolvedValue({
        get: (key: string) => {
            if (key === 'file') return file;
            return null;
        }
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe(ERROR_MESSAGES.FILE_TOO_LARGE);
  });
});
