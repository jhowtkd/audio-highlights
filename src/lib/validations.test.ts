import { describe, it, expect } from 'vitest';
import { generateHighlightsRequestSchema, decupageRequestSchema } from './validations';

describe('Validation Schemas', () => {
  describe('generateHighlightsRequestSchema', () => {
    const validConfig = {
      minDuration: 15,
      maxDuration: 60,
      targetDuration: 30,
      quantity: 5,
      episodeTitle: 'Valid Title',
      focusTopics: ['topic1', 'topic2'],
      excludeTopics: [],
    };

    const validSegment = {
      id: '1',
      start: 0,
      end: 10,
      text: 'Valid text segment',
    };

    it('accepts valid input', () => {
      const input = {
        segments: [validSegment],
        config: validConfig,
      };
      expect(() => generateHighlightsRequestSchema.parse(input)).not.toThrow();
    });

    it('rejects long episode title', () => {
      const input = {
        segments: [validSegment],
        config: { ...validConfig, episodeTitle: 'a'.repeat(201) },
      };
      expect(() => generateHighlightsRequestSchema.parse(input)).toThrow();
    });

    it('rejects too many focus topics', () => {
      const input = {
        segments: [validSegment],
        config: { ...validConfig, focusTopics: Array(11).fill('topic') },
      };
      expect(() => generateHighlightsRequestSchema.parse(input)).toThrow();
    });

    it('rejects long focus topic string', () => {
        const input = {
          segments: [validSegment],
          config: { ...validConfig, focusTopics: ['a'.repeat(101)] },
        };
        expect(() => generateHighlightsRequestSchema.parse(input)).toThrow();
      });

    it('rejects long segment text', () => {
        const input = {
            segments: [{ ...validSegment, text: 'a'.repeat(2001) }],
            config: validConfig,
        };
        expect(() => generateHighlightsRequestSchema.parse(input)).toThrow();
    });
  });

  describe('decupageRequestSchema', () => {
      const validConfig = {
          silenceThreshold: 2000,
          detectFillers: true,
          detectOffTopic: true,
          narrativeContext: 'Context',
      };
      const validSegment = {
        id: '1',
        start: 0,
        end: 10,
        text: 'Valid text segment',
      };

      it('accepts valid input', () => {
          const input = {
              segments: [validSegment],
              config: validConfig,
          };
          expect(() => decupageRequestSchema.parse(input)).not.toThrow();
      });

      it('rejects long narrative context', () => {
          const input = {
              segments: [validSegment],
              config: { ...validConfig, narrativeContext: 'a'.repeat(1001) },
          };
          expect(() => decupageRequestSchema.parse(input)).toThrow();
      });
  });
});
