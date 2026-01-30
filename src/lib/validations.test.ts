import { describe, it, expect } from 'vitest';
import { highlightConfigSchema, decupageRequestSchema } from './validations';
import {
  MAX_EPISODE_TITLE_LENGTH,
  MAX_NARRATIVE_CONTEXT_LENGTH,
  MAX_TOPIC_LENGTH,
  MAX_TOPICS_COUNT,
  MIN_HIGHLIGHT_DURATION,
  MAX_HIGHLIGHT_DURATION,
  MIN_HIGHLIGHT_QUANTITY,
} from './constants';

describe('Validation Schemas', () => {
  describe('highlightConfigSchema', () => {
    it('should pass with valid inputs', () => {
      const validConfig = {
        minDuration: MIN_HIGHLIGHT_DURATION,
        maxDuration: MAX_HIGHLIGHT_DURATION,
        targetDuration: MIN_HIGHLIGHT_DURATION + 10,
        quantity: MIN_HIGHLIGHT_QUANTITY,
        episodeTitle: 'Valid Title',
        focusTopics: ['topic1', 'topic2'],
        excludeTopics: ['topic3'],
      };
      const result = highlightConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should fail when episodeTitle is too long', () => {
      const invalidConfig = {
        minDuration: MIN_HIGHLIGHT_DURATION,
        maxDuration: MAX_HIGHLIGHT_DURATION,
        targetDuration: MIN_HIGHLIGHT_DURATION + 10,
        quantity: MIN_HIGHLIGHT_QUANTITY,
        episodeTitle: 'a'.repeat(MAX_EPISODE_TITLE_LENGTH + 1),
      };
      const result = highlightConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('episodeTitle');
        expect(result.error.issues[0].code).toBe('too_big');
      }
    });

    it('should fail when focusTopics has too many items', () => {
      const invalidConfig = {
        minDuration: MIN_HIGHLIGHT_DURATION,
        maxDuration: MAX_HIGHLIGHT_DURATION,
        targetDuration: MIN_HIGHLIGHT_DURATION + 10,
        quantity: MIN_HIGHLIGHT_QUANTITY,
        focusTopics: Array(MAX_TOPICS_COUNT + 1).fill('topic'),
      };
      const result = highlightConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('focusTopics');
      }
    });

    it('should fail when a topic string is too long', () => {
      const invalidConfig = {
        minDuration: MIN_HIGHLIGHT_DURATION,
        maxDuration: MAX_HIGHLIGHT_DURATION,
        targetDuration: MIN_HIGHLIGHT_DURATION + 10,
        quantity: MIN_HIGHLIGHT_QUANTITY,
        focusTopics: ['a'.repeat(MAX_TOPIC_LENGTH + 1)],
      };
      const result = highlightConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('focusTopics');
      }
    });
  });

  describe('decupageRequestSchema', () => {
    const validSegments = [{ id: '1', start: 0, end: 1, text: 'test' }];

    it('should pass with valid narrativeContext', () => {
      const validRequest = {
        segments: validSegments,
        config: {
          narrativeContext: 'Valid context',
        },
      };
      const result = decupageRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should fail when narrativeContext is too long', () => {
      const invalidRequest = {
        segments: validSegments,
        config: {
          narrativeContext: 'a'.repeat(MAX_NARRATIVE_CONTEXT_LENGTH + 1),
        },
      };
      const result = decupageRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('config');
        expect(result.error.issues[0].path).toContain('narrativeContext');
      }
    });
  });
});
