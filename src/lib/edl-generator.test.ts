import { describe, it, expect } from 'vitest';
import { generateEDL } from './edl-generator';
import type { DecupageSegment } from '@/types/decupagem';

describe('EDL Generator', () => {
  it('should prevent CSV formula injection', () => {
    const maliciousSegments: DecupageSegment[] = [
      {
        id: '1',
        startTime: 0,
        endTime: 5,
        text: '=cmd|\\\' /C calc\'!A0',
        problemType: 'off_topic',
        severity: 'high',
        suggestion: 'cut',
        reason: '+cmd|\\\' /C calc\'!A0',
        status: 'pending'
      },
      {
        id: '2',
        startTime: 5,
        endTime: 10,
        text: '-cmd|\\\' /C calc\'!A0',
        problemType: 'filler_words',
        severity: 'low',
        suggestion: 'keep',
        reason: '@cmd|\\\' /C calc\'!A0',
        status: 'pending'
      }
    ];

    const csvOutput = generateEDL(maliciousSegments, 'csv', { title: 'Test' });

    // The dangerous characters (=, +, -, @) should be prefixed with a single quote
    expect(csvOutput).toContain('"\'-cmd|\\\' /C calc\'!A0"');
    expect(csvOutput).toContain('"\'+cmd|\\\' /C calc\'!A0"');
    expect(csvOutput).toContain('"\'=cmd|\\\' /C calc\'!A0"');
    expect(csvOutput).toContain('"\'@cmd|\\\' /C calc\'!A0"');

    // Check that it doesn't accidentally prefix safe strings
    expect(csvOutput).toContain('"off_topic"');
    expect(csvOutput).toContain('"filler_words"');
  });
});
