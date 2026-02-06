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
export const GPT_MAX_TOKENS = 16000;
export const GPT_TEMPERATURE = 0.7;
export const GPT_MODEL = 'gpt-4o';
export const WHISPER_MODEL = 'whisper-1';

// Parallel transcription settings
export const PARALLEL_TRANSCRIPTION_LIMIT = 3; // max simultaneous chunks
export const CHUNK_DURATION_SECONDS = 90; // 90 seconds per chunk (max ~3.5MB @ 320kbps, safe for 4.5MB Vercel limit)

// Highlight configuration limits
export const MIN_HIGHLIGHT_DURATION = 15; // seconds
export const MAX_HIGHLIGHT_DURATION = 600; // seconds (10 minutes)
export const MIN_HIGHLIGHT_QUANTITY = 1;
export const MAX_HIGHLIGHT_QUANTITY = 20;
// Input security limits
export const MAX_EPISODE_TITLE_LENGTH = 200;
export const MAX_TOPIC_LENGTH = 50;
export const MAX_TOPICS_COUNT = 10;
export const MAX_NARRATIVE_CONTEXT_LENGTH = 1000;
export const MAX_SEGMENTS_COUNT = 20000; // Limit to prevent DoS

export const DEFAULT_TARGET_DURATION = 60; // seconds
export const CUT_PADDING_SECONDS = 0.5; // seconds (padding start/end to avoid clipping words)

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
  FILE_TOO_LARGE: 'O arquivo excede o limite de 500MB. Comprima o áudio ou divida em partes menores.',
  AUDIO_TOO_LONG: 'O áudio excede o limite de 4 horas. Divida o arquivo em partes menores.',
  NO_FILE_PROVIDED: 'Nenhum arquivo enviado',
  TRANSCRIPTION_FAILED: 'Não foi possível transcrever o áudio. Verifique o arquivo e tente novamente.',
  HIGHLIGHTS_FAILED: 'Não foi possível gerar os highlights. Tente novamente em alguns instantes.',
  INVALID_AUDIO_FILE: 'Formato inválido. Aceitamos: MP3, WAV, M4A, OGG, FLAC, WebM.',
  API_KEY_MISSING: 'Chave da API OpenAI não configurada',
  NETWORK_ERROR: 'Sem conexão com a internet. Verifique sua rede e tente novamente.',
} as const;
