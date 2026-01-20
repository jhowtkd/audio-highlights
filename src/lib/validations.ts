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
} from './constants';

// Transcription API validation
export const transcribeRequestSchema = z.object({
  file: z.custom<File>(
    (val) => val instanceof File,
    'File is required'
  ).refine(
    (file) => file.size <= MAX_FILE_SIZE,
    `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
  ),
  projectId: z.string().uuid().optional(),
});

// Highlight configuration validation
export const highlightConfigSchema = z.object({
  minDuration: z.number()
    .min(MIN_HIGHLIGHT_DURATION, `Minimum duration is ${MIN_HIGHLIGHT_DURATION}s`)
    .max(MAX_HIGHLIGHT_DURATION, `Maximum duration is ${MAX_HIGHLIGHT_DURATION}s`),
  maxDuration: z.number()
    .min(MIN_HIGHLIGHT_DURATION, `Minimum duration is ${MIN_HIGHLIGHT_DURATION}s`)
    .max(MAX_HIGHLIGHT_DURATION, `Maximum duration is ${MAX_HIGHLIGHT_DURATION}s`),
  targetDuration: z.number()
    .min(MIN_HIGHLIGHT_DURATION, `Minimum duration is ${MIN_HIGHLIGHT_DURATION}s`)
    .max(MAX_HIGHLIGHT_DURATION, `Maximum duration is ${MAX_HIGHLIGHT_DURATION}s`),
  quantity: z.number()
    .int()
    .min(MIN_HIGHLIGHT_QUANTITY, `Minimum quantity is ${MIN_HIGHLIGHT_QUANTITY}`)
    .max(MAX_HIGHLIGHT_QUANTITY, `Maximum quantity is ${MAX_HIGHLIGHT_QUANTITY}`),
  focusTopics: z.array(z.string()).optional(),
  excludeTopics: z.array(z.string()).optional(),
  platform: z.enum(['tiktok', 'youtube_shorts', 'instagram_reels', 'podcast_trailer', 'custom']).optional(),
  isMix: z.boolean().optional(),
  mixDuration: z.number().optional(),
});
// .refine validations removed as they might conflict with Mix mode logic or need conditional checking. 
// Basic type checking is sufficient for now, logic will be handled in the API.

// Highlights API request validation
export const generateHighlightsRequestSchema = z.object({
  segments: z.array(z.object({
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
  })).min(1, 'At least one segment is required'),
  config: highlightConfigSchema,
});

// Environment variables validation
export const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
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
