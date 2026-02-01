/**
 * Zod schemas for validation
 */
import { z } from 'zod';
import {
  MAX_FILE_SIZE,
  MIN_HIGHLIGHT_DURATION,
  MAX_HIGHLIGHT_DURATION,
  MIN_HIGHLIGHT_QUANTITY,
  MAX_HIGHLIGHT_QUANTITY,
  MAX_EPISODE_TITLE_LENGTH,
  MAX_TOPIC_LENGTH,
  MAX_TOPICS_COUNT,
  MAX_NARRATIVE_CONTEXT_LENGTH,
} from './constants';

// Transcription API validation
export const transcribeRequestSchema = z.object({
  file: z.custom<File>(
    (val) => val instanceof File,
    'O arquivo é obrigatório'
  ).refine(
    (file) => file.size <= MAX_FILE_SIZE,
    `O tamanho do arquivo deve ser menor que ${MAX_FILE_SIZE / (1024 * 1024)}MB`
  ),
  projectId: z.string().uuid().optional(),
});

// Highlight configuration validation
export const highlightConfigSchema = z.object({
  minDuration: z.number()
    .min(MIN_HIGHLIGHT_DURATION, `Duração mínima é ${MIN_HIGHLIGHT_DURATION}s`)
    .max(MAX_HIGHLIGHT_DURATION, `Duração máxima é ${MAX_HIGHLIGHT_DURATION}s`),
  maxDuration: z.number()
    .min(MIN_HIGHLIGHT_DURATION, `Duração mínima é ${MIN_HIGHLIGHT_DURATION}s`)
    .max(MAX_HIGHLIGHT_DURATION, `Duração máxima é ${MAX_HIGHLIGHT_DURATION}s`),
  targetDuration: z.number()
    .min(MIN_HIGHLIGHT_DURATION, `Duração mínima é ${MIN_HIGHLIGHT_DURATION}s`)
    .max(MAX_HIGHLIGHT_DURATION, `Duração máxima é ${MAX_HIGHLIGHT_DURATION}s`),
  quantity: z.number()
    .int()
    .min(MIN_HIGHLIGHT_QUANTITY, `Quantidade mínima é ${MIN_HIGHLIGHT_QUANTITY}`)
    .max(MAX_HIGHLIGHT_QUANTITY, `Quantidade máxima é ${MAX_HIGHLIGHT_QUANTITY}`),
  focusTopics: z.array(
    z.string().max(MAX_TOPIC_LENGTH, `Tópico deve ter no máximo ${MAX_TOPIC_LENGTH} caracteres`)
  ).max(MAX_TOPICS_COUNT, `Máximo de ${MAX_TOPICS_COUNT} tópicos permitidos`).optional(),
  excludeTopics: z.array(
    z.string().max(MAX_TOPIC_LENGTH, `Tópico deve ter no máximo ${MAX_TOPIC_LENGTH} caracteres`)
  ).max(MAX_TOPICS_COUNT, `Máximo de ${MAX_TOPICS_COUNT} tópicos permitidos`).optional(),
  platform: z.enum(['tiktok', 'youtube_shorts', 'instagram_reels', 'podcast_trailer', 'custom']).optional(),
  isMix: z.boolean().optional(),
  mixDuration: z.number().optional(),
  episodeTitle: z.string().max(MAX_EPISODE_TITLE_LENGTH, `Título deve ter no máximo ${MAX_EPISODE_TITLE_LENGTH} caracteres`).optional(),
});
// .refine validations removed as they might conflict with Mix mode logic or need conditional checking. 
// Basic type checking is sufficient for now, logic will be handled in the API.

// Shared segment schema
export const transcriptionSegmentSchema = z.object({
  id: z.string(),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  text: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  words: z.array(z.object({
    word: z.string(),
    start: z.number().nonnegative(),
    end: z.number().nonnegative(),
    confidence: z.number().min(0).max(1).optional(),
  })).optional(),
});

// Highlights API request validation
export const generateHighlightsRequestSchema = z.object({
  segments: z.array(transcriptionSegmentSchema).min(1, 'Pelo menos um segmento é obrigatório'),
  config: highlightConfigSchema,
});

// Decupagem API request validation
export const decupageRequestSchema = z.object({
  segments: z.array(transcriptionSegmentSchema),
  config: z.object({
    silenceThreshold: z.number().min(500).max(10000).default(2000),
    detectFillers: z.boolean().default(true),
    detectOffTopic: z.boolean().default(true),
    narrativeContext: z.string().max(MAX_NARRATIVE_CONTEXT_LENGTH, `O contexto narrativo deve ter no máximo ${MAX_NARRATIVE_CONTEXT_LENGTH} caracteres`).optional(),
  }),
});

// Environment variables validation
export const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'A variável OPENAI_API_KEY é obrigatória'),
  OPENAI_ORG_ID: z.string().optional(),
});

/**
 * Validates environment variables on server startup
 */
export function validateEnv() {
  try {
    return envSchema.parse({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_ORG_ID: process.env.OPENAI_ORG_ID,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => issue.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}
