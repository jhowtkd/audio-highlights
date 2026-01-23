'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Transcription, TranscriptionSegment } from '@/types';
import { CHUNK_DURATION_SECONDS, PARALLEL_TRANSCRIPTION_LIMIT } from '@/lib/constants';

interface ChunkResult {
    index: number;
    segments: TranscriptionSegment[];
    fullText: string;
    language?: string;
    error?: string;
}

interface ChunkTask {
    file: File;
    startTime: number;
    index: number;
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

    // Shared State
    const chunkQueue: ChunkTask[] = [];
    const results: ChunkResult[] = [];
    let chunksSplitCount = 0;
    let chunksTranscribedCount = 0;
    let splittingComplete = false;
    let splitError: Error | null = null;

    // Helper to update progress
    const updateProgress = () => {
        // Split: 0-30% contribution
        // Transcribe: 0-65% contribution
        // Merging: 95-100%
        const splitProgress = (chunksSplitCount / totalChunks) * 30;
        const transcribeProgress = (chunksTranscribedCount / totalChunks) * 65;
        const total = Math.min(95, Math.round(splitProgress + transcribeProgress));

        const message = splittingComplete
            ? `Transcrevendo... (${chunksTranscribedCount}/${totalChunks})`
            : `Preparando e transcrevendo... (${chunksTranscribedCount}/${totalChunks})`;

        onProgress(total, message);
    };

    onProgress(0, `Iniciando processamento de ${totalChunks} partes...`);

    // Producer: Split Audio
    const splitter = async () => {
        try {
            for (let i = 0; i < totalChunks; i++) {
                const startTime = i * CHUNK_DURATION_SECONDS;
                const chunkDuration = Math.min(CHUNK_DURATION_SECONDS, audioDuration - startTime);

                // Check for previous errors to abort early
                // (Note: we continue splitting even if transcription fails, but good to check)

                try {
                    const chunkFile = await ffmpegSplitFn(file, startTime, chunkDuration, i);
                    chunkQueue.push({ file: chunkFile, startTime, index: i });
                    chunksSplitCount++;
                    updateProgress();
                } catch (error) {
                    console.error(`Erro ao preparar chunk ${i + 1}:`, error);
                    // If splitting fails, we can't transcribe this chunk.
                    // We push an error placeholder or handle it.
                    // For simplicity, we just won't push to queue, and transcriber loop will finish eventually.
                    // But we should record the error in results?
                    results.push({
                        index: i,
                        segments: [],
                        fullText: `[Erro ao dividir parte ${i + 1}]`,
                        error: String(error)
                    });
                    // Count as "transcribed" (processed) to avoid stuck progress
                    chunksTranscribedCount++;
                }
            }
        } catch (err) {
            splitError = err as Error;
            console.error('Fatal error in splitter:', err);
        } finally {
            splittingComplete = true;
        }
    };

    // Consumer: Transcribe Audio
    const transcriber = async () => {
        while (true) {
            let task: ChunkTask | undefined;

            // Critical section: Get task from queue
            if (chunkQueue.length > 0) {
                task = chunkQueue.shift();
            } else {
                if (splittingComplete) break;
                if (splitError) break;

                // Wait for more tasks
                await new Promise(r => setTimeout(r, 200));
                continue;
            }

            if (!task) continue;

            const { file: chunkFile, startTime, index } = task;

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

                results.push({
                    index,
                    segments: adjustedSegments,
                    fullText: result.fullText,
                    language: result.language
                });
            } catch (error) {
                console.error(`Erro no chunk ${index + 1}:`, error);
                results.push({
                    index,
                    segments: [],
                    fullText: `[Parte ${index + 1} não transcrita]`,
                    error: String(error)
                });
            } finally {
                chunksTranscribedCount++;
                updateProgress();
            }
        }
    };

    // Start Pipeline
    // 1. Start splitter
    const splitPromise = splitter();

    // 2. Start workers (up to limit)
    // We launch workers immediately; they will wait for chunks.
    const workerCount = Math.min(PARALLEL_TRANSCRIPTION_LIMIT, totalChunks);
    const workers = Array.from({ length: workerCount }, () => transcriber());

    // 3. Wait for all to finish
    await Promise.all([splitPromise, ...workers]);

    // Phase 3: Merge results (95-100%)
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

    const responseText = await response.text();
    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        console.error('Response was not JSON:', responseText.substring(0, 200));
        throw new Error(`Server Error (${response.status}): ${responseText.substring(0, 100)}...`);
    }

    if (!response.ok) {
        throw new Error(data.error || 'Erro na transcrição');
    }

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

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Response was not JSON:', responseText.substring(0, 200));
                throw new Error(`Server Error (${response.status}): ${responseText.substring(0, 100)}...`);
            }

            if (!response.ok) {
                throw new Error(data.error || 'Erro na transcrição do chunk');
            }

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
