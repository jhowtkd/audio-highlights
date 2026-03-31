import { describe, it, expect } from 'vitest';
import { generateEDL } from './edl-generator';
import type { DecupageSegment } from '@/types/decupagem';

describe('generateEDL', () => {
  describe('generateCSV', () => {
    it('should generate valid CSV with sanitized fields to prevent formula injection', () => {
      const segments: DecupageSegment[] = [
        {
          id: '1',
          startTime: 10,
          endTime: 15,
          text: '=cmd|\\\' /C calc\\\'!\'A0\'',
          problemType: 'filler_words',
          suggestion: 'cut',
          reason: '+1+1',
          severity: 'medium',
          status: 'pending'
        },
        {
          id: '2',
          startTime: 20,
          endTime: 25,
          text: 'Normal text "with quotes"',
          // @ts-expect-error Testing invalid input for sanitization
          problemType: '-off_topic',
          // @ts-expect-error Testing invalid input for sanitization
          suggestion: '@review',
          reason: '\tTAB injected',
          severity: 'medium',
          status: 'pending'
        },
        {
          id: '3',
          startTime: 30,
          endTime: 35,
          text: '\rcarriage return',
          problemType: 'stutter',
          suggestion: 'keep',
          reason: 'Normal reason',
          severity: 'low',
          status: 'pending'
        }
      ];

      const csv = generateEDL(segments, 'csv', { title: 'Test' });

      const lines = csv.split('\n');
      expect(lines[0]).toBe('Start Time,End Time,Duration,Text,Problem,Suggestion,Reason');

      // Segment 1: =, +
      expect(lines[1]).toBe('10.000,15.000,5.000,"\'=cmd|\\\' /C calc\\\'!\'A0\'","filler_words","cut","\'+1+1"');

      // Segment 2: Quotes escaping, -, @, \t
      expect(lines[2]).toBe('20.000,25.000,5.000,"Normal text ""with quotes""","\'-off_topic","\'@review","\'\tTAB injected"');

      // Segment 3: \r
      expect(lines[3]).toBe('30.000,35.000,5.000,"\'\rcarriage return","stutter","keep","Normal reason"');
    });
  });
});
