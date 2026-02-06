import { describe, it, expect } from 'vitest';
import { highlightConfigSchema, decupageRequestSchema, searchRequestSchema } from './validations';
import {
  MAX_EPISODE_TITLE_LENGTH,
  MAX_TOPIC_LENGTH,
  MAX_TOPICS_COUNT,
  MAX_NARRATIVE_CONTEXT_LENGTH,
  MAX_SEGMENTS_COUNT,
} from './constants';

describe('Validation Schemas', () => {
  describe('highlightConfigSchema', () => {
    it('should validate episodeTitle length', () => {
      const longTitle = 'a'.repeat(MAX_EPISODE_TITLE_LENGTH + 1);
      const validTitle = 'a'.repeat(MAX_EPISODE_TITLE_LENGTH);

      const validConfig = {
        minDuration: 15,
        maxDuration: 60,
        targetDuration: 30,
        quantity: 5,
        episodeTitle: validTitle,
      };

      const invalidConfig = {
        ...validConfig,
        episodeTitle: longTitle,
      };

      expect(() => highlightConfigSchema.parse(validConfig)).not.toThrow();
      expect(() => highlightConfigSchema.parse(invalidConfig)).toThrow();
    });

    it('should validate focusTopics length and count', () => {
      const longTopic = 'a'.repeat(MAX_TOPIC_LENGTH + 1);
      const validTopic = 'a'.repeat(MAX_TOPIC_LENGTH);

      const validConfig = {
        minDuration: 15,
        maxDuration: 60,
        targetDuration: 30,
        quantity: 5,
        focusTopics: Array(MAX_TOPICS_COUNT).fill(validTopic),
      };

      const invalidConfigLength = {
        ...validConfig,
        focusTopics: [longTopic],
      };

      const invalidConfigCount = {
        ...validConfig,
        focusTopics: Array(MAX_TOPICS_COUNT + 1).fill('topic'),
      };

      expect(() => highlightConfigSchema.parse(validConfig)).not.toThrow();
      expect(() => highlightConfigSchema.parse(invalidConfigLength)).toThrow();
      expect(() => highlightConfigSchema.parse(invalidConfigCount)).toThrow();
    });

    it('should validate excludeTopics length and count', () => {
        const longTopic = 'a'.repeat(MAX_TOPIC_LENGTH + 1);
        const validTopic = 'a'.repeat(MAX_TOPIC_LENGTH);

        const validConfig = {
          minDuration: 15,
          maxDuration: 60,
          targetDuration: 30,
          quantity: 5,
          excludeTopics: Array(MAX_TOPICS_COUNT).fill(validTopic),
        };

        const invalidConfigLength = {
          ...validConfig,
          excludeTopics: [longTopic],
        };

        const invalidConfigCount = {
          ...validConfig,
          excludeTopics: Array(MAX_TOPICS_COUNT + 1).fill('topic'),
        };

        expect(() => highlightConfigSchema.parse(validConfig)).not.toThrow();
        expect(() => highlightConfigSchema.parse(invalidConfigLength)).toThrow();
        expect(() => highlightConfigSchema.parse(invalidConfigCount)).toThrow();
      });
  });

  describe('decupageRequestSchema', () => {
    it('should validate narrativeContext length', () => {
      const longContext = 'a'.repeat(MAX_NARRATIVE_CONTEXT_LENGTH + 1);
      const validContext = 'a'.repeat(MAX_NARRATIVE_CONTEXT_LENGTH);

      const validSegment = {
          id: '1',
          start: 0,
          end: 1,
          text: 'test',
          words: []
      };

      const validRequest = {
        segments: [validSegment],
        config: {
          silenceThreshold: 2000,
          detectFillers: true,
          detectOffTopic: true,
          narrativeContext: validContext,
        },
      };

      const invalidRequest = {
        segments: [validSegment],
        config: {
          silenceThreshold: 2000,
          detectFillers: true,
          detectOffTopic: true,
          narrativeContext: longContext,
        },
      };

      // decupageRequestSchema parses the WHOLE object, so we need to match structure
      expect(() => decupageRequestSchema.parse(validRequest)).not.toThrow();
      expect(() => decupageRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('searchRequestSchema', () => {
    it('should validate max segments count', () => {
      const validSegment = {
        id: '1',
        start: 0,
        end: 1,
        text: 'test',
      };

      const validRequest = {
        query: 'test',
        segments: [validSegment],
      };

      // We create a large array but fill it with the same reference to be memory efficient
      // Note: This might still consume memory but it's the standard way to test array length validation
      const invalidRequest = {
        query: 'test',
        segments: Array(MAX_SEGMENTS_COUNT + 1).fill(validSegment),
      };

      expect(() => searchRequestSchema.parse(validRequest)).not.toThrow();
      expect(() => searchRequestSchema.parse(invalidRequest)).toThrow(/excede o limite máximo/);
    });
  });
});
