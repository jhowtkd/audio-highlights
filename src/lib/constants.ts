/**
 * Application-wide constants
 */

// Maximum file size (500 MB - processed via FFmpeg chunking if needed)
export const MAX_FILE_SIZE = 500 * 1024 * 1024;
export const MAX_AUDIO_DURATION = 4 * 60 * 60; // 4 hours in seconds

// Accepted audio file types
export const ACCEPTED_AUDIO_TYPES = {
  'audio/mpeg': ['.mp3'],
  'audio/mp3': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/wave': ['.wav'],
  'audio/x-wav': ['.wav'],
  'audio/x-m4a': ['.m4a'],
  'audio/mp4': ['.m4a'],
  'audio/m4a': ['.m4a'],
  'audio/aac': ['.m4a', '.aac'],
  'audio/x-aac': ['.m4a', '.aac'],
  'audio/ogg': ['.ogg', '.opus'],
  'audio/opus': ['.opus'],
  'audio/webm': ['.webm'],
  'audio/flac': ['.flac'],
  'audio/x-flac': ['.flac'],
} as const;

// API configuration
export const GPT_MAX_TOKENS = 4000;
export const GPT_TEMPERATURE = 0.7;
export const GPT_MODEL = 'gpt-4o-mini';
export const WHISPER_MODEL = 'whisper-1';

// Highlight configuration limits
export const MIN_HIGHLIGHT_DURATION = 15; // seconds
export const MAX_HIGHLIGHT_DURATION = 600; // seconds (10 minutes)
export const MIN_HIGHLIGHT_QUANTITY = 1;
export const MAX_HIGHLIGHT_QUANTITY = 20;
export const DEFAULT_TARGET_DURATION = 60; // seconds

// Platform Templates - preconfigured settings for different social platforms
export const PLATFORM_TEMPLATES = {
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    minDuration: 15,
    maxDuration: 60,
    targetDuration: 30,
    description: 'Clips curtos e dinâmicos (15-60s)'
  },
  youtube_shorts: {
    name: 'YouTube Shorts',
    icon: '📺',
    minDuration: 15,
    maxDuration: 59,
    targetDuration: 45,
    description: 'Máximo 59s para Shorts'
  },
  instagram_reels: {
    name: 'Instagram Reels',
    icon: '📸',
    minDuration: 15,
    maxDuration: 90,
    targetDuration: 30,
    description: 'Ideal para Reels (15-90s)'
  },
  podcast_trailer: {
    name: 'Podcast Trailer',
    icon: '🎙️',
    minDuration: 60,
    maxDuration: 180,
    targetDuration: 120,
    description: 'Trailer do episódio (1-3min)'
  },
  custom: {
    name: 'Personalizado',
    icon: '⚙️',
    minDuration: 30,
    maxDuration: 120,
    targetDuration: 60,
    description: 'Configure manualmente'
  }
} as const;

// Audio player
export const SKIP_INTERVAL = 10; // seconds
export const DEFAULT_VOLUME = 1;

// Error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'Arquivo muito grande. Máximo permitido: 25MB (Limite da OpenAI)',
  AUDIO_TOO_LONG: 'Áudio muito longo. Máximo permitido: 4 horas',
  NO_FILE_PROVIDED: 'Nenhum arquivo enviado',
  TRANSCRIPTION_FAILED: 'Erro ao processar a transcrição',
  HIGHLIGHTS_FAILED: 'Erro ao gerar highlights',
  INVALID_AUDIO_FILE: 'Não foi possível processar o arquivo de áudio',
  API_KEY_MISSING: 'Chave da API OpenAI não configurada',
  NETWORK_ERROR: 'Erro de conexão. Tente novamente.',
} as const;
