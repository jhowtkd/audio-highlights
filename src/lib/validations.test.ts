
import { describe, it, expect } from 'vitest';
import {
  highlightConfigSchema,
  decupageRequestSchema,
} from './validations';
import {
  MAX_EPISODE_TITLE_LENGTH,
  MAX_NARRATIVE_CONTEXT_LENGTH,
  MAX_TOPIC_LENGTH,
  MAX_TOPICS_COUNT,
} from './constants';

describe('Security Validations', () => {
  describe('highlightConfigSchema', () => {
    const validConfig = {
      minDuration: 30,
      maxDuration: 60,
      targetDuration: 45,
      quantity: 5,
    };

    it('should fail when episodeTitle exceeds MAX_EPISODE_TITLE_LENGTH', () => {
      const longTitle = 'a'.repeat(MAX_EPISODE_TITLE_LENGTH + 1);
      const result = highlightConfigSchema.safeParse({
        ...validConfig,
        episodeTitle: longTitle,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod default message for max length
        expect(result.error.issues[0].message).toContain('Too big');
      }
    });

    it('should accept episodeTitle within MAX_EPISODE_TITLE_LENGTH', () => {
      const validTitle = 'a'.repeat(MAX_EPISODE_TITLE_LENGTH);
      const result = highlightConfigSchema.safeParse({
        ...validConfig,
        episodeTitle: validTitle,
      });
      expect(result.success).toBe(true);
    });

    it('should fail when a topic exceeds MAX_TOPIC_LENGTH', () => {
      const longTopic = 'a'.repeat(MAX_TOPIC_LENGTH + 1);
      const result = highlightConfigSchema.safeParse({
        ...validConfig,
        focusTopics: [longTopic],
      });
      expect(result.success).toBe(false);
    });

    it('should fail when topics count exceeds MAX_TOPICS_COUNT', () => {
      const tooManyTopics = Array(MAX_TOPICS_COUNT + 1).fill('topic');
      const result = highlightConfigSchema.safeParse({
        ...validConfig,
        focusTopics: tooManyTopics,
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid topics', () => {
        const validTopics = Array(MAX_TOPICS_COUNT).fill('a'.repeat(MAX_TOPIC_LENGTH));
        const result = highlightConfigSchema.safeParse({
            ...validConfig,
            focusTopics: validTopics,
        });
        expect(result.success).toBe(true);
    });
  });

  describe('decupageRequestSchema', () => {
    const validSegments = [
      { id: '1', start: 0, end: 1, text: 'test' }
    ];

    it('should fail when narrativeContext exceeds MAX_NARRATIVE_CONTEXT_LENGTH', () => {
      const longContext = 'a'.repeat(MAX_NARRATIVE_CONTEXT_LENGTH + 1);
      const result = decupageRequestSchema.safeParse({
        segments: validSegments,
        config: {
          narrativeContext: longContext,
        },
      });
      expect(result.success).toBe(false);
    });

    it('should accept narrativeContext within MAX_NARRATIVE_CONTEXT_LENGTH', () => {
        const validContext = 'a'.repeat(MAX_NARRATIVE_CONTEXT_LENGTH);
        const result = decupageRequestSchema.safeParse({
            segments: validSegments,
            config: {
                narrativeContext: validContext,
            },
        });
        expect(result.success).toBe(true);
    });
  });
});
