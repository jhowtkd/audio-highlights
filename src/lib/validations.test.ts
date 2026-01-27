import { describe, it, expect } from 'vitest';
import { highlightConfigSchema, decupageRequestSchema, transcriptionSegmentSchema } from './validations';
import {
  MAX_EPISODE_TITLE_LENGTH,
  MAX_TOPIC_LENGTH,
  MAX_NARRATIVE_CONTEXT_LENGTH,
  MAX_SEGMENT_TEXT_LENGTH,
} from './constants';

describe('Validation Schemas Security Limits', () => {
  describe('highlightConfigSchema', () => {
    it('should accept valid episodeTitle', () => {
      const result = highlightConfigSchema.safeParse({
        minDuration: 20, maxDuration: 60, targetDuration: 30, quantity: 5,
        episodeTitle: 'A'.repeat(MAX_EPISODE_TITLE_LENGTH)
      });
      expect(result.success).toBe(true);
    });

    it('should reject episodeTitle exceeding max length', () => {
      const result = highlightConfigSchema.safeParse({
        minDuration: 20, maxDuration: 60, targetDuration: 30, quantity: 5,
        episodeTitle: 'A'.repeat(MAX_EPISODE_TITLE_LENGTH + 1)
      });
      expect(result.success).toBe(false);
    });

    it('should reject focusTopics item exceeding max length', () => {
      const result = highlightConfigSchema.safeParse({
        minDuration: 20, maxDuration: 60, targetDuration: 30, quantity: 5,
        focusTopics: ['valid', 'A'.repeat(MAX_TOPIC_LENGTH + 1)]
      });
      expect(result.success).toBe(false);
    });

    it('should reject excludeTopics item exceeding max length', () => {
        const result = highlightConfigSchema.safeParse({
          minDuration: 20, maxDuration: 60, targetDuration: 30, quantity: 5,
          excludeTopics: ['valid', 'A'.repeat(MAX_TOPIC_LENGTH + 1)]
        });
        expect(result.success).toBe(false);
      });
  });

  describe('decupageRequestSchema', () => {
    it('should reject narrativeContext exceeding max length', () => {
      const validSegment = { id: '1', start: 0, end: 1, text: 'hi' };
      const result = decupageRequestSchema.safeParse({
        segments: [validSegment],
        config: {
          narrativeContext: 'A'.repeat(MAX_NARRATIVE_CONTEXT_LENGTH + 1)
        }
      });
      expect(result.success).toBe(false);
    });
  });

  describe('transcriptionSegmentSchema', () => {
    it('should reject text exceeding max length', () => {
      const result = transcriptionSegmentSchema.safeParse({
        id: '1', start: 0, end: 1,
        text: 'A'.repeat(MAX_SEGMENT_TEXT_LENGTH + 1)
      });
      expect(result.success).toBe(false);
    });
  });
});
