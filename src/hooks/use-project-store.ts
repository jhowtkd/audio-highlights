'use client';

import { create } from 'zustand';
import type { Project, Transcription, GeneratedHighlight, HighlightConfig } from '@/types';

interface ProjectState {
  // Estado atual
  project: Project | null;
  isUploading: boolean;
  isTranscribing: boolean;
  isGeneratingHighlights: boolean;
  transcriptionProgress: number;
  highlightProgress: number;
  error: string | null;

  // Ações
  setProject: (project: Project | null) => void;
  updateProject: (updates: Partial<Project>) => void;
  setTranscription: (transcription: Transcription) => void;
  setHighlights: (highlights: GeneratedHighlight[]) => void;
  setHighlightConfig: (config: HighlightConfig) => void;

  // Estados de loading
  setUploading: (isUploading: boolean) => void;
  setTranscribing: (isTranscribing: boolean) => void;
  setGeneratingHighlights: (isGenerating: boolean) => void;
  setTranscriptionProgress: (progress: number) => void;
  setHighlightProgress: (progress: number) => void;

  // Erro
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  project: null,
  isUploading: false,
  isTranscribing: false,
  isGeneratingHighlights: false,
  transcriptionProgress: 0,
  highlightProgress: 0,
  error: null,
};

export const useProjectStore = create<ProjectState>((set) => ({
  ...initialState,

  setProject: (project) => set({ project, error: null }),

  updateProject: (updates) =>
    set((state) => ({
      project: state.project ? { ...state.project, ...updates } : null,
    })),

  setTranscription: (transcription) =>
    set((state) => ({
      project: state.project
        ? { ...state.project, transcription, status: 'TRANSCRIBED' }
        : null,
    })),

  setHighlights: (highlights) =>
    set((state) => ({
      project: state.project
        ? { ...state.project, highlights, status: 'COMPLETED' }
        : null,
    })),

  setHighlightConfig: (config) =>
    set((state) => ({
      project: state.project
        ? { ...state.project, highlightConfig: config }
        : null,
    })),

  setUploading: (isUploading) => set({ isUploading }),
  setTranscribing: (isTranscribing) => set({ isTranscribing }),
  setGeneratingHighlights: (isGenerating) => set({ isGeneratingHighlights: isGenerating }),
  setTranscriptionProgress: (progress) => set({ transcriptionProgress: progress }),
  setHighlightProgress: (progress) => set({ highlightProgress: progress }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
