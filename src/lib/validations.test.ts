import { describe, it, expect } from 'vitest';
import {
  highlightConfigSchema,
  decupageRequestSchema,
} from './validations';
import {
  MAX_EPISODE_TITLE_LENGTH,
  MAX_TOPIC_LENGTH,
  MAX_TOPICS_COUNT,
  MAX_NARRATIVE_CONTEXT_LENGTH,
  MIN_HIGHLIGHT_DURATION,
  MAX_HIGHLIGHT_DURATION,
  DEFAULT_TARGET_DURATION,
  MIN_HIGHLIGHT_QUANTITY,
} from './constants';

describe('Validation Schemas', () => {
  describe('highlightConfigSchema', () => {
    const validConfig = {
      minDuration: MIN_HIGHLIGHT_DURATION,
      maxDuration: MAX_HIGHLIGHT_DURATION,
      targetDuration: DEFAULT_TARGET_DURATION,
      quantity: MIN_HIGHLIGHT_QUANTITY,
    };

    it('should accept valid inputs', () => {
      const input = {
        ...validConfig,
        episodeTitle: 'Valid Title',
        focusTopics: ['Topic 1', 'Topic 2'],
      };
      expect(highlightConfigSchema.parse(input)).toEqual(input);
    });

    it('should reject episodeTitle exceeding MAX_EPISODE_TITLE_LENGTH', () => {
      const input = {
        ...validConfig,
        episodeTitle: 'a'.repeat(MAX_EPISODE_TITLE_LENGTH + 1),
      };
      expect(() => highlightConfigSchema.parse(input)).toThrow();
    });

    it('should reject focusTopics with items exceeding MAX_TOPIC_LENGTH', () => {
      const input = {
        ...validConfig,
        focusTopics: ['a'.repeat(MAX_TOPIC_LENGTH + 1)],
      };
      expect(() => highlightConfigSchema.parse(input)).toThrow();
    });

    it('should reject focusTopics exceeding MAX_TOPICS_COUNT', () => {
      const input = {
        ...validConfig,
        focusTopics: Array(MAX_TOPICS_COUNT + 1).fill('valid topic'),
      };
      expect(() => highlightConfigSchema.parse(input)).toThrow();
    });

    it('should reject excludeTopics with items exceeding MAX_TOPIC_LENGTH', () => {
      const input = {
        ...validConfig,
        excludeTopics: ['a'.repeat(MAX_TOPIC_LENGTH + 1)],
      };
      expect(() => highlightConfigSchema.parse(input)).toThrow();
    });
  });

  describe('decupageRequestSchema', () => {
    const validRequest = {
      segments: [],
      config: {
        silenceThreshold: 2000,
        detectFillers: true,
        detectOffTopic: true,
      },
    };

    it('should accept valid inputs', () => {
      const input = {
        ...validRequest,
        config: {
          ...validRequest.config,
          narrativeContext: 'This is a valid context.',
        },
      };
      expect(decupageRequestSchema.parse(input)).toEqual(input);
    });

    it('should reject narrativeContext exceeding MAX_NARRATIVE_CONTEXT_LENGTH', () => {
      const input = {
        ...validRequest,
        config: {
          ...validRequest.config,
          narrativeContext: 'a'.repeat(MAX_NARRATIVE_CONTEXT_LENGTH + 1),
        },
      };
      expect(() => decupageRequestSchema.parse(input)).toThrow();
    });
  });
});
