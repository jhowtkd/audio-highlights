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

// GPT-generated highlight format
export interface GPTHighlight {
  title: string;
  summary: string;
  startTime: number;
  endTime: number;
  relevanceScore: number;
  tags: string[];
  reasoning: string;
  // Novos campos inteligentes
  emotionTone?: 'excited' | 'humorous' | 'dramatic' | 'informative' | 'controversial' | 'inspirational';
  viralFactors?: {
    hasHook: boolean;
    hasStorytelling: boolean;
    hasSurprise: boolean;
    emotionalIntensity: number;
  };
  suggestedTitles?: string[];
  quotableLines?: string[];
}

export interface GPTHighlightsResponse {
  episodeSummary?: string;
  keyTopics?: string[];
  highlights: GPTHighlight[];
}

