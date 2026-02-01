import { describe, it, expect } from 'vitest';
import { highlightConfigSchema, decupageRequestSchema } from './validations';
import {
  MAX_EPISODE_TITLE_LENGTH,
  MAX_TOPIC_LENGTH,
  MAX_TOPICS_COUNT,
  MAX_NARRATIVE_CONTEXT_LENGTH,
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

      const baseRequest = {
        segments: [], // Empty segments for validation check (might need valid segment structure if array min(1) is enforced elsewhere, but schema says segments is just array)
        // Actually segments schema might require valid segment structure. Let's provide minimal valid segment.
      };

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
});
