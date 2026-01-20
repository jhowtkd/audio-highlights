import { describe, it, expect } from 'vitest';
import { generateSRT } from './export';
import { GeneratedHighlight, TranscriptionSegment } from '@/types';

// Mock types
const mockHighlight: GeneratedHighlight = {
  id: 'h1',
  startTime: 10,
  endTime: 20,
  title: 'Test Highlight',
  duration: 10,
  transcript: 'Test transcript',
  relevanceScore: 100,
  tags: [],
  reasoning: '',
  summary: '',
};

const mockSegments: TranscriptionSegment[] = [
  { id: 's1', start: 0, end: 5, text: 'Segment 1' },
  { id: 's2', start: 5, end: 10, text: 'Segment 2' },
  { id: 's3', start: 10, end: 12, text: 'Segment 3' }, // Inside
  { id: 's4', start: 12, end: 15, text: 'Segment 4' }, // Inside
  { id: 's5', start: 15, end: 20, text: 'Segment 5' }, // Inside
  { id: 's6', start: 18, end: 22, text: 'Segment 6' }, // Ends outside
  { id: 's7', start: 20, end: 25, text: 'Segment 7' }, // Starts at end
  { id: 's8', start: 25, end: 30, text: 'Segment 8' },
];

describe('generateSRT', () => {
  it('should include only segments strictly contained in the highlight range', () => {
    // Expected behavior:
    // s3: 10-12 (Inside)
    // s4: 12-15 (Inside)
    // s5: 15-20 (Inside)
    // s6: 18-22 (Ends at 22 > 20, so excluded by strict containment)
    // s7: 20-25 (Starts at 20, excluded)

    const srt = generateSRT(mockHighlight, mockSegments);

    // Check content
    expect(srt).toContain('Segment 3');
    expect(srt).toContain('Segment 4');
    expect(srt).toContain('Segment 5');

    expect(srt).not.toContain('Segment 1');
    expect(srt).not.toContain('Segment 2');
    expect(srt).not.toContain('Segment 6');
    expect(srt).not.toContain('Segment 7');
    expect(srt).not.toContain('Segment 8');
  });

  it('should handle empty segments', () => {
    const srt = generateSRT(mockHighlight, []);
    expect(srt).toContain('00:00:00,000 --> 00:00:10,000');
    expect(srt).toContain('Test transcript');
  });

  it('should handle no relevant segments', () => {
    const segments = [{ id: 's1', start: 0, end: 5, text: 'Out' }];
    const srt = generateSRT(mockHighlight, segments);
    expect(srt).toContain('00:00:00,000 --> 00:00:10,000');
    expect(srt).toContain('Test transcript');
  });

  it('should correctly format timestamps relative to highlight start', () => {
      // s3 starts at 10. highlight starts at 10. relative start: 0.
      const srt = generateSRT(mockHighlight, mockSegments);
      // 00:00:00,000
      expect(srt).toContain('00:00:00,000 --> 00:00:02,000'); // s3: 10-12 -> 0-2
  });
});
