'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Transcription, TranscriptionSegment } from '@/types';

const CHUNK_DURATION_SECONDS = 20 * 60; // 20 minutes per chunk

interface ChunkingProgress {
    stage: 'splitting' | 'transcribing' | 'merging';
    currentChunk: number;
    totalChunks: number;
    message: string;
}

/**
 * Process a large audio file by:
 * 1. Using FFmpeg to split into time-based chunks (20min each)
 * 2. Transcribing each chunk via API
 * 3. Merging results with adjusted timestamps
 */
export async function processLargeAudioWithFFmpeg(
    file: File,
    projectId: string,
    audioDuration: number,
    ffmpegSplitFn: (file: File, startTime: number, duration: number, index: number) => Promise<File>,
    onProgress: (progress: number, message: string) => void
): Promise<Transcription> {

    // Calculate number of chunks needed
    const totalChunks = Math.ceil(audioDuration / CHUNK_DURATION_SECONDS);

    // If audio is short enough, process directly
    if (totalChunks <= 1 || audioDuration <= CHUNK_DURATION_SECONDS) {
        onProgress(10, 'Transcrevendo áudio...');
        return await transcribeSingleFile(file, projectId, onProgress);
    }

    let allSegments: TranscriptionSegment[] = [];
    let fullText = '';
    let detectedLanguage = 'pt';

    // Process each chunk
    for (let i = 0; i < totalChunks; i++) {
        const startTime = i * CHUNK_DURATION_SECONDS;
        const chunkDuration = Math.min(CHUNK_DURATION_SECONDS, audioDuration - startTime);

        // Split progress: 0-30%
        const splitProgress = Math.round((i / totalChunks) * 30);
        onProgress(splitProgress, `Preparando parte ${i + 1} de ${totalChunks}...`);

        // Use FFmpeg to extract this chunk
        const chunkFile = await ffmpegSplitFn(file, startTime, chunkDuration, i);

        // Transcribe progress: 30-90%
        const transcribeBaseProgress = 30 + Math.round((i / totalChunks) * 60);
        onProgress(transcribeBaseProgress, `Transcrevendo parte ${i + 1} de ${totalChunks}...`);

        // Transcribe this chunk
        const result = await transcribeChunk(chunkFile, projectId);

        // Adjust timestamps and merge
        const adjustedSegments = result.segments.map(s => ({
            ...s,
            start: s.start + startTime,
            end: s.end + startTime,
            words: s.words?.map(w => ({
                ...w,
                start: w.start + startTime,
                end: w.end + startTime
            }))
        }));

        allSegments = [...allSegments, ...adjustedSegments];
        fullText += (fullText ? ' ' : '') + result.fullText;

        if (i === 0 && result.language) {
            detectedLanguage = result.language;
        }
    }

    onProgress(95, 'Finalizando...');

    // Build final transcription
    return {
        id: uuidv4(),
        projectId,
        fullText,
        segments: allSegments,
        language: detectedLanguage,
        duration: audioDuration,
        createdAt: new Date(),
    };
}

async function transcribeSingleFile(
    file: File,
    projectId: string,
    onProgress: (progress: number, message: string) => void
): Promise<Transcription> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    onProgress(50, 'Enviando para transcrição...');

    const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na transcrição');
    }

    const data = await response.json();
    return data.transcription;
}

async function transcribeChunk(file: File, projectId: string): Promise<Transcription> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na transcrição do chunk');
    }

    const data = await response.json();
    return data.transcription;
}
