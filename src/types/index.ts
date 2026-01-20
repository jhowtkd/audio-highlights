// Tipos principais da aplicação AudioHighlights

export interface TranscriptionSegment {
  id: string;
  start: number;      // segundos
  end: number;        // segundos
  text: string;
  confidence?: number; // 0-1
  words?: WordTimestamp[];
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface Transcription {
  id: string;
  projectId: string;
  fullText: string;
  segments: TranscriptionSegment[];
  language?: string;
  duration: number;
  createdAt: Date;
}

// Tipos para funcionalidades inteligentes
export type EmotionTone = 'excited' | 'humorous' | 'dramatic' | 'informative' | 'controversial' | 'inspirational';

export type PlatformTemplate = 'tiktok' | 'youtube_shorts' | 'instagram_reels' | 'podcast_trailer' | 'custom';

// Tipos de gancho baseados em neurociência da atenção (pesquisa 2025)
export type HookType = 'promise' | 'fear' | 'curiosity' | 'contrarian' | 'in_media_res';

// Arquétipos de conteúdo viral
export type ContentArchetype = 'story' | 'hot_take' | 'tutorial' | 'human_moment' | 'revelation';

export interface ViralFactors {
  hasHook: boolean;
  hasStorytelling: boolean;
  hasSurprise: boolean;
  emotionalIntensity: number; // 1-10
  // Novos campos baseados na pesquisa de viralidade
  hookType: HookType;
  contentArchetype: ContentArchetype;
  loopPotential: boolean;
  saveability: number; // 1-10
  shareability: number; // 1-10
  completionPotential: number; // 1-10
}

export interface EpisodeAnalysis {
  summary: string;
  keyTopics: string[];
  totalHighlightsGenerated: number;
}

export interface HighlightConfig {
  minDuration: number;      // segundos (30-300)
  maxDuration: number;      // segundos (60-600)
  targetDuration: number;   // duração média desejada
  quantity: number;         // 1-20
  focusTopics?: string[];   // tópicos prioritários
  excludeTopics?: string[]; // tópicos a ignorar
  isMix?: boolean;          // modo storytelling/mix
  mixDuration?: number;     // duração total para o mix

  platform?: PlatformTemplate; // template de plataforma selecionado (mantido para compatibilidade, mas opcional)
}

export interface GeneratedHighlight {
  id: string;
  title: string;
  summary: string;
  startTime: number;
  endTime: number;
  duration: number;
  transcript: string;
  relevanceScore: number;
  tags: string[];
  reasoning: string;
  // Campos inteligentes de viralidade
  emotionTone?: EmotionTone;
  viralFactors?: ViralFactors;
  suggestedTitles?: string[];
  quotableLines?: string[];
  // Novos campos de análise de gancho
  hookAnalysis?: string;
  openingLine?: string;
  // Suporte a segmentos múltiplos (Mix Mode)
  segments?: {         
    start: number;
    end: number;
  }[];
}

export type ProjectStatus =
  | 'UPLOADED'
  | 'TRANSCRIBING'
  | 'TRANSCRIBED'
  | 'GENERATING_HIGHLIGHTS'
  | 'COMPLETED'
  | 'ERROR';

export interface Project {
  id: string;
  name: string;
  description?: string;
  audioUrl: string;
  audioFileName: string;
  audioDuration: number;
  status: ProjectStatus;
  transcription?: Transcription;
  highlights?: GeneratedHighlight[];
  highlightConfig?: HighlightConfig;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para exportação
export type ExportFormat = 'srt' | 'vtt' | 'txt' | 'markdown' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  highlightId?: string;
  includeTimestamps: boolean;
  maxLineLength?: number;
}

// Tipos para API responses
export interface UploadResponse {
  success: boolean;
  project?: Project;
  error?: string;
}

export interface TranscribeResponse {
  event: 'progress' | 'segment' | 'complete' | 'error';
  data: {
    progress?: number;
    segment?: TranscriptionSegment;
    transcription?: Transcription;
    error?: string;
  };
}

export interface HighlightsResponse {
  event: 'analyzing' | 'highlight' | 'complete' | 'error';
  data: {
    progress?: number;
    highlight?: GeneratedHighlight;
    highlights?: GeneratedHighlight[];
    stats?: {
      totalDuration: number;
      averageDuration: number;
      coveragePercent: number;
    };
    error?: string;
  };
}
