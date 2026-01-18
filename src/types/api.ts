/**
 * API types for external service responses
 */

// OpenAI Whisper API types
export interface WhisperSegment {
  start: number;
  end: number;
  text: string;
  avg_logprob?: number;
}

export interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

export interface WhisperResponse {
  text: string;
  language?: string;
  segments?: WhisperSegment[];
  words?: WhisperWord[];
}

// OpenAI Chat API types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  choices: {
    message: {
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Tipos de gancho baseados em neurociência da atenção (pesquisa 2025)
export type HookType = 'promise' | 'fear' | 'curiosity' | 'contrarian' | 'in_media_res';

// Arquétipos de conteúdo viral
export type ContentArchetype = 'story' | 'hot_take' | 'tutorial' | 'human_moment' | 'revelation';

// GPT-generated highlight format
export interface GPTHighlight {
  title: string;
  summary: string;
  startTime: number;
  endTime: number;
  relevanceScore: number;
  tags: string[];
  reasoning: string;
  // Campos inteligentes de viralidade
  emotionTone?: 'excited' | 'humorous' | 'dramatic' | 'informative' | 'controversial' | 'inspirational';
  viralFactors?: {
    hasHook: boolean;
    hasStorytelling: boolean;
    hasSurprise: boolean;
    emotionalIntensity: number;
    // Novos campos baseados na pesquisa
    hookType: HookType;
    contentArchetype: ContentArchetype;
    loopPotential: boolean;
    saveability: number; // 1-10: quão "salvável" é o conteúdo (educacional, tático)
    shareability: number; // 1-10: quão "compartilhável" é (emocional, engraçado)
    completionPotential: number; // 1-10: probabilidade de assistir até o final
  };
  suggestedTitles?: string[];
  quotableLines?: string[];
  // Novos campos de análise de gancho
  hookAnalysis?: string; // Análise específica dos primeiros 3 segundos
  openingLine?: string; // Primeira frase do corte (para avaliar pattern interrupt)
}

export interface GPTHighlightsResponse {
  episodeSummary?: string;
  keyTopics?: string[];
  highlights: GPTHighlight[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

