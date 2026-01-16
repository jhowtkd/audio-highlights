/**
 * Application-wide constants
 */

// File upload constraints
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_AUDIO_DURATION = 4 * 60 * 60; // 4 hours in seconds

// Accepted audio file types
export const ACCEPTED_AUDIO_TYPES = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-m4a': ['.m4a'],
  'audio/mp4': ['.m4a'],
  'audio/ogg': ['.ogg'],
  'audio/webm': ['.webm'],
} as const;

// API configuration
export const GPT_MAX_TOKENS = 4000;
export const GPT_TEMPERATURE = 0.7;
export const GPT_MODEL = 'gpt-4o';
export const WHISPER_MODEL = 'whisper-1';

// Highlight configuration limits
export const MIN_HIGHLIGHT_DURATION = 30; // seconds
export const MAX_HIGHLIGHT_DURATION = 600; // seconds (10 minutes)
export const MIN_HIGHLIGHT_QUANTITY = 1;
export const MAX_HIGHLIGHT_QUANTITY = 20;
export const DEFAULT_TARGET_DURATION = 60; // seconds

// Audio player
export const SKIP_INTERVAL = 10; // seconds
export const DEFAULT_VOLUME = 1;

// Error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'Arquivo muito grande. Máximo permitido: 500MB',
  AUDIO_TOO_LONG: 'Áudio muito longo. Máximo permitido: 4 horas',
  NO_FILE_PROVIDED: 'Nenhum arquivo enviado',
  TRANSCRIPTION_FAILED: 'Erro ao processar a transcrição',
  HIGHLIGHTS_FAILED: 'Erro ao gerar highlights',
  INVALID_AUDIO_FILE: 'Não foi possível processar o arquivo de áudio',
  API_KEY_MISSING: 'Chave da API OpenAI não configurada',
  NETWORK_ERROR: 'Erro de conexão. Tente novamente.',
} as const;
