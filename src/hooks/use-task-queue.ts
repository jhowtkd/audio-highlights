'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTaskQueueContext } from '@/contexts/task-context';
import { useFFmpeg } from '@/hooks/use-ffmpeg';
import { processLargeAudioWithFFmpeg } from '@/lib/audio-chunking';
import type { TaskProgress, TaskResult } from '@/types/task-types';
import type { Transcription, GeneratedHighlight, HighlightConfig, EpisodeAnalysis } from '@/types';

const CHUNK_THRESHOLD_SECONDS = 20 * 60; // 20 minutes

export function useTaskQueue() {
    const context = useTaskQueueContext();
    const { convertToMp3, splitAudio } = useFFmpeg();
    const router = useRouter();
    const processingRef = useRef(false);

    const {
        state,
        addTask,
        updateProgress,
        completeTask,
        failTask,
        removeTask,
        clearCompleted,
        getTask,
        getNextPendingTask,
        startProcessing,
        getTaskFile,
    } = context;

    // Processa uma task individual
    const processTask = useCallback(async (taskId: string) => {
        const task = getTask(taskId);
        const file = getTaskFile(taskId);

        if (!task || !file) {
            failTask(taskId, 'Arquivo não encontrado');
            return;
        }

        try {
            startProcessing(taskId);

            // Etapa 1: Conversão para MP3 (se necessário)
            let audioToTranscribe = file;
            const needsConversion = !file.type.includes('mpeg') && !file.name.toLowerCase().endsWith('.mp3');

            if (needsConversion) {
                updateProgress(taskId, {
                    stage: 'converting',
                    percent: 5,
                    message: 'Convertendo áudio para formato compatível...',
                });
                audioToTranscribe = await convertToMp3(file);
            }

            // Etapa 2: Transcrição
            updateProgress(taskId, {
                stage: 'transcribing',
                percent: 10,
                message: 'Iniciando transcrição...',
            });

            let transcription: Transcription;
            const duration = task.audioDuration || 0;

            if (duration > CHUNK_THRESHOLD_SECONDS) {
                // Áudio longo - processar em chunks
                transcription = await processLargeAudioWithFFmpeg(
                    audioToTranscribe,
                    crypto.randomUUID(),
                    duration,
                    splitAudio,
                    (progress, message) => {
                        updateProgress(taskId, {
                            stage: 'transcribing',
                            percent: 10 + Math.round(progress * 0.6), // 10-70%
                            message,
                        });
                    }
                );
            } else {
                // Áudio curto - transcrição direta
                updateProgress(taskId, {
                    stage: 'transcribing',
                    percent: 30,
                    message: 'Transcrevendo áudio...',
                });

                const formData = new FormData();
                formData.append('file', audioToTranscribe);
                formData.append('projectId', crypto.randomUUID());

                const response = await fetch('/api/transcribe', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro na transcrição');
                }

                const data = await response.json();
                transcription = data.transcription;
            }

            updateProgress(taskId, {
                stage: 'transcribing',
                percent: 70,
                message: 'Transcrição concluída!',
            });

            // Criar URL para o áudio
            const audioUrl = URL.createObjectURL(file);

            // Resultado final (sem highlights por enquanto - serão gerados depois pelo usuário)
            const result: TaskResult = {
                transcription,
                audioDuration: duration,
                audioUrl,
            };

            completeTask(taskId, result);
            toast.success(`"${task.filename}" processado com sucesso!`);

        } catch (error) {
            console.error('Erro no processamento:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            failTask(taskId, errorMessage);
            toast.error(`Erro ao processar "${task.filename}": ${errorMessage}`);
        }
    }, [getTask, getTaskFile, startProcessing, updateProgress, completeTask, failTask, convertToMp3, splitAudio]);

    // Processa a fila automaticamente
    const processQueue = useCallback(async () => {
        if (processingRef.current || state.isProcessing) return;

        const nextTask = getNextPendingTask();
        if (!nextTask) return;

        processingRef.current = true;
        await processTask(nextTask.id);
        processingRef.current = false;
    }, [state.isProcessing, getNextPendingTask, processTask]);

    // Auto-processar quando há tasks pendentes
    useEffect(() => {
        if (!state.isProcessing && state.tasks.some(t => t.status === 'pending')) {
            processQueue();
        }
    }, [state.tasks, state.isProcessing, processQueue]);

    // Adiciona task e redireciona para dashboard
    const addTaskAndNavigate = useCallback((file: File, audioDuration?: number) => {
        const taskId = addTask(file, audioDuration);
        toast.success(`"${file.name}" adicionado à fila!`);
        router.push('/tasks');
        return taskId;
    }, [addTask, router]);

    return {
        // Estado
        tasks: state.tasks,
        currentTaskId: state.currentTaskId,
        isProcessing: state.isProcessing,
        pendingCount: state.tasks.filter(t => t.status === 'pending').length,
        completedCount: state.tasks.filter(t => t.status === 'completed').length,
        errorCount: state.tasks.filter(t => t.status === 'error').length,

        // Ações
        addTask,
        addTaskAndNavigate,
        removeTask,
        clearCompleted,
        getTask,

        // Processamento
        processQueue,
    };
}
