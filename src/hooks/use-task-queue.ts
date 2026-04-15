'use client';

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTaskQueueContext } from '@/contexts/task-context';
import { useFFmpeg } from '@/hooks/use-ffmpeg';
import { processLargeAudioWithFFmpeg } from '@/lib/audio-chunking';
import { getFileHash, getCachedTranscription, setCachedTranscription } from '@/lib/transcription-cache';
import type { TaskResult } from '@/types/task-types';
import type { Transcription } from '@/types';

const CHUNK_THRESHOLD_SECONDS = 90; // 90 seconds - lowered to avoid Vercel's body size limit

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
        resetTask, // Added resetTask
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

            // Etapa 2: Verificar cache antes de transcrever
            updateProgress(taskId, {
                stage: 'transcribing',
                percent: 10,
                message: 'Verificando cache...',
            });

            // Check cache first
            const cacheKey = await getFileHash(audioToTranscribe);
            const cachedTranscription = getCachedTranscription(cacheKey);

            let transcription: Transcription;
            const duration = task.audioDuration || 0;

            if (cachedTranscription) {
                // Cache hit - use cached transcription
                transcription = cachedTranscription as Transcription;
                updateProgress(taskId, {
                    stage: 'transcribing',
                    percent: 70,
                    message: 'Usando transcrição do cache!',
                });
                console.log('[Cache] Using cached transcription for:', file.name);
            } else if (duration > CHUNK_THRESHOLD_SECONDS) {
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

                const responseText = await response.text();
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch {
                    // Fallback for non-JSON errors (like 403 Forbidden HTML)
                    throw new Error(`Server Error (${response.status}): ${responseText.substring(0, 100)}...`);
                }

                if (!response.ok) {
                    throw new Error(data.error || 'Erro na transcrição');
                }

                transcription = data.transcription;
            }

            // Save to cache for future use (only if not from cache)
            if (!cachedTranscription) {
                setCachedTranscription(cacheKey, transcription, file.name, file.size);
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

    // Reinicia e processa uma task novamente (ignorando cache)
    const retryTask = useCallback((taskId: string, newFile?: File) => {
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return false;

        // Se um novo arquivo foi fornecido, atualiza a referência
        if (newFile) {
            context.setTaskFile(taskId, newFile);
        }

        // Verifica se o arquivo existe na memória
        const file = getTaskFile(taskId);

        if (!file) {
            toast.info('Selecione o arquivo novamente para continuar.');
            return false;
        }

        try {
            // Limpa cache antigo - usando o hash da task que deve persistir
            // Como não temos o hash direto, vamos remover baseado no nome e tamanho do arquivo re-selecionado ou existente
            // removeCachedTranscription(task.hash); // Idealmente teríamos o hash aqui

            // Reset state
            resetTask(taskId);

            // Trigger processing
            setTimeout(() => {
                processQueue();
            }, 100);

            toast.info('Reiniciando processamento...');
            return true;
        } catch (error) {
            console.error('Error retrying task:', error);
            toast.error('Erro ao reiniciar processamento');
            return false;
        }
    }, [state.tasks, getTaskFile, context, resetTask, processQueue]);

    // Adiciona task e redireciona para dashboard
    const addTaskAndNavigate = useCallback((file: File, audioDuration?: number) => {
        const taskId = addTask(file, audioDuration);
        toast.success(`"${file.name}" adicionado à fila!`);
        router.push('/tasks');
        return taskId;
    }, [addTask, router]);

    // ✅ Performance: Optimize task counts calculation
    // Replaced 3 separate filter().length calls (O(3n)) with a single reduce pass (O(n)).
    // Memoized to prevent recalculation unless state.tasks changes.
    const { pendingCount, completedCount, errorCount } = useMemo(() => {
        return state.tasks.reduce((acc, task) => {
            if (task.status === 'pending') acc.pendingCount++;
            else if (task.status === 'completed') acc.completedCount++;
            else if (task.status === 'error') acc.errorCount++;
            return acc;
        }, { pendingCount: 0, completedCount: 0, errorCount: 0 });
    }, [state.tasks]);

    return {
        // Estado
        tasks: state.tasks,
        currentTaskId: state.currentTaskId,
        isProcessing: state.isProcessing,
        pendingCount,
        completedCount,
        errorCount,

        // Ações
        addTask,
        addTaskAndNavigate,
        removeTask,
        clearCompleted,
        getTask,

        // Processamento
        processQueue,
        retryTask,
    };
}
