// Tipos para o sistema de filas de tasks

import type { Transcription, GeneratedHighlight, HighlightConfig, EpisodeAnalysis } from './index';

export type TaskStatus =
    | 'pending'      // Aguardando na fila
    | 'converting'   // Convertendo formato de áudio
    | 'transcribing' // Transcrevendo com Whisper
    | 'generating'   // Gerando highlights com GPT
    | 'completed'    // Finalizado com sucesso
    | 'error';       // Erro no processamento

export interface TaskProgress {
    stage: TaskStatus;
    percent: number;          // 0-100
    message: string;          // Mensagem atual
    elapsedSeconds: number;   // Tempo decorrido
    estimatedSeconds?: number; // Tempo estimado restante
}

export interface TaskResult {
    transcription?: Transcription;
    highlights?: GeneratedHighlight[];
    highlightConfig?: HighlightConfig;
    episodeAnalysis?: EpisodeAnalysis;
    audioDuration?: number;
    audioUrl?: string;
}

export interface Task {
    id: string;
    filename: string;
    fileSize: number;          // bytes
    audioDuration?: number;    // seconds (se conhecido)
    status: TaskStatus;
    progress: TaskProgress;
    result?: TaskResult;
    error?: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}

export interface TaskQueueState {
    tasks: Task[];
    currentTaskId: string | null;
    isProcessing: boolean;
}

// Actions para o reducer
export type TaskAction =
    | { type: 'ADD_TASK'; payload: Omit<Task, 'progress' | 'status' | 'createdAt'> & { file: File } }
    | { type: 'START_TASK'; payload: { taskId: string } }
    | { type: 'UPDATE_PROGRESS'; payload: { taskId: string; progress: Partial<TaskProgress> } }
    | { type: 'COMPLETE_TASK'; payload: { taskId: string; result: TaskResult } }
    | { type: 'FAIL_TASK'; payload: { taskId: string; error: string } }
    | { type: 'REMOVE_TASK'; payload: { taskId: string } }
    | { type: 'CLEAR_COMPLETED' }
    | { type: 'RESET_TASK'; payload: { taskId: string } }
    | { type: 'LOAD_FROM_STORAGE'; payload: { tasks: Task[] } };

// Constantes
export const STORAGE_KEY = 'audio-highlights-tasks';
export const MAX_CONCURRENT_TASKS = 1; // Processar uma task por vez
