'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Transcription, TranscriptionSegment } from '@/types';
import { CHUNK_DURATION_SECONDS, PARALLEL_TRANSCRIPTION_LIMIT } from '@/lib/constants';

interface ChunkingProgress {
    stage: 'splitting' | 'transcribing' | 'merging';
    currentChunk: number;
    totalChunks: number;
    message: string;
}

interface ChunkResult {
    index: number;
    segments: TranscriptionSegment[];
    fullText: string;
    language?: string;
    error?: string;
}

/**
 * Process a large audio file by:
 * 1. Using FFmpeg to split into time-based chunks (10min each)
 * 2. Transcribing chunks in PARALLEL (up to 3 simultaneous)
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

    console.log(`[Parallel] Processing ${totalChunks} chunks with up to ${PARALLEL_TRANSCRIPTION_LIMIT} simultaneous...`);

    // Phase 1: Prepare all chunks (0-20%)
    onProgress(5, `Preparando ${totalChunks} partes...`);

    const chunkFiles: { file: File; startTime: number; index: number }[] = [];

    for (let i = 0; i < totalChunks; i++) {
        const startTime = i * CHUNK_DURATION_SECONDS;
        const chunkDuration = Math.min(CHUNK_DURATION_SECONDS, audioDuration - startTime);

        const progress = Math.round((i / totalChunks) * 20);
        onProgress(progress, `Preparando parte ${i + 1} de ${totalChunks}...`);

        try {
            const chunkFile = await ffmpegSplitFn(file, startTime, chunkDuration, i);
            chunkFiles.push({ file: chunkFile, startTime, index: i });
        } catch (error) {
            console.error(`Erro ao preparar chunk ${i + 1}:`, error);
        }
    }

    // Phase 2: Transcribe using a concurrency pool (20-90%)
    const results: ChunkResult[] = [];
    let completedChunks = 0;
    let currentIndex = 0;

    const processChunk = async (chunkIndex: number) => {
        const { file: chunkFile, startTime, index } = chunkFiles[chunkIndex];
        try {
            const result = await transcribeChunk(chunkFile, projectId);

            // Adjust timestamps
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

            completedChunks++;
            const progress = 20 + Math.round((completedChunks / totalChunks) * 70);
            onProgress(progress, `Transcrevendo... (${completedChunks}/${totalChunks})`);

            results.push({
                index,
                segments: adjustedSegments,
                fullText: result.fullText,
                language: result.language
            } as ChunkResult);
        } catch (error) {
            console.error(`Erro no chunk ${index + 1}:`, error);
            completedChunks++;
            results.push({
                index,
                segments: [],
                fullText: `[Parte ${index + 1} não transcrita]`,
                error: String(error)
            } as ChunkResult);
        }
    };

    const worker = async () => {
        while (currentIndex < chunkFiles.length) {
            const index = currentIndex++;
            await processChunk(index);
        }
    };

    const workers = Array.from(
        { length: Math.min(PARALLEL_TRANSCRIPTION_LIMIT, chunkFiles.length) },
        () => worker()
    );

    await Promise.all(workers);

    // Phase 3: Merge results in order (90-100%)
    onProgress(95, 'Finalizando...');

    // Sort by original index to maintain order
    results.sort((a, b) => a.index - b.index);

    // Optimize merging: Single pass reduce is faster than multiple iterations (flatMap + map + find)
    const { allSegments, fullTextParts, detectedLanguage } = results.reduce((acc, r) => {
        // Efficiently append segments
        // Using a loop with push is faster and safer (avoids stack overflow) than spread operator for large arrays
        for (const segment of r.segments) {
            acc.allSegments.push(segment);
        }

        acc.fullTextParts.push(r.fullText);

        if (!acc.detectedLanguage && r.language) {
            acc.detectedLanguage = r.language;
        }
        return acc;
    }, {
        allSegments: [] as TranscriptionSegment[],
        fullTextParts: [] as string[],
        detectedLanguage: ''
    });

    return {
        id: uuidv4(),
        projectId,
        fullText: fullTextParts.join(' '),
        segments: allSegments,
        language: detectedLanguage || 'pt',
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

async function transcribeChunk(file: File, projectId: string, retries = 3): Promise<Transcription> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Transcrevendo chunk ${file.name}, tentativa ${attempt}/${retries}`);

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
            console.log(`Chunk ${file.name} transcrito com sucesso`);
            return data.transcription;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.warn(`Tentativa ${attempt}/${retries} falhou para ${file.name}:`, lastError.message);

            if (attempt < retries) {
                // Wait before retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    throw lastError || new Error('Erro desconhecido na transcrição do chunk');
}
