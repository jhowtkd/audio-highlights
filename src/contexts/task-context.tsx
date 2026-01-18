'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
    Task,
    TaskQueueState,
    TaskAction,
    TaskProgress,
    TaskResult
} from '@/types/task-types';
import { STORAGE_KEY } from '@/types/task-types';

// Estado inicial
const initialState: TaskQueueState = {
    tasks: [],
    currentTaskId: null,
    isProcessing: false,
};

// Reducer para gerenciar estado
function taskReducer(state: TaskQueueState, action: TaskAction): TaskQueueState {
    switch (action.type) {
        case 'ADD_TASK': {
            const newTask: Task = {
                id: action.payload.id || uuidv4(),
                filename: action.payload.filename,
                fileSize: action.payload.fileSize,
                audioDuration: action.payload.audioDuration,
                status: 'pending',
                progress: {
                    stage: 'pending',
                    percent: 0,
                    message: 'Aguardando na fila...',
                    elapsedSeconds: 0,
                },
                createdAt: new Date(),
            };
            return {
                ...state,
                tasks: [...state.tasks, newTask],
            };
        }

        case 'START_TASK': {
            return {
                ...state,
                currentTaskId: action.payload.taskId,
                isProcessing: true,
                tasks: state.tasks.map(task =>
                    task.id === action.payload.taskId
                        ? { ...task, status: 'converting', startedAt: new Date() }
                        : task
                ),
            };
        }

        case 'UPDATE_PROGRESS': {
            return {
                ...state,
                tasks: state.tasks.map(task =>
                    task.id === action.payload.taskId
                        ? {
                            ...task,
                            status: action.payload.progress.stage || task.status,
                            progress: { ...task.progress, ...action.payload.progress },
                        }
                        : task
                ),
            };
        }

        case 'COMPLETE_TASK': {
            return {
                ...state,
                currentTaskId: null,
                isProcessing: false,
                tasks: state.tasks.map(task =>
                    task.id === action.payload.taskId
                        ? {
                            ...task,
                            status: 'completed',
                            progress: { ...task.progress, percent: 100, message: 'Concluído!' },
                            result: action.payload.result,
                            completedAt: new Date(),
                        }
                        : task
                ),
            };
        }

        case 'FAIL_TASK': {
            return {
                ...state,
                currentTaskId: null,
                isProcessing: false,
                tasks: state.tasks.map(task =>
                    task.id === action.payload.taskId
                        ? {
                            ...task,
                            status: 'error',
                            progress: { ...task.progress, message: 'Erro no processamento' },
                            error: action.payload.error,
                            completedAt: new Date(),
                        }
                        : task
                ),
            };
        }

        case 'REMOVE_TASK': {
            return {
                ...state,
                tasks: state.tasks.filter(task => task.id !== action.payload.taskId),
                currentTaskId: state.currentTaskId === action.payload.taskId ? null : state.currentTaskId,
            };
        }

        case 'CLEAR_COMPLETED': {
            return {
                ...state,
                tasks: state.tasks.filter(task => task.status !== 'completed'),
            };
        }

        case 'LOAD_FROM_STORAGE': {
            // Restaurar tasks do storage, resetando tasks em andamento para pending
            const restoredTasks = action.payload.tasks.map(task => ({
                ...task,
                createdAt: new Date(task.createdAt),
                startedAt: task.startedAt ? new Date(task.startedAt) : undefined,
                completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
                // Reset tasks que estavam processando para pending
                status: ['converting', 'transcribing', 'generating'].includes(task.status)
                    ? 'pending' as const
                    : task.status,
                progress: ['converting', 'transcribing', 'generating'].includes(task.status)
                    ? { ...task.progress, stage: 'pending' as const, message: 'Aguardando na fila...' }
                    : task.progress,
            }));
            return {
                ...state,
                tasks: restoredTasks,
            };
        }

        default:
            return state;
    }
}

// Tipos do contexto
interface TaskQueueContextType {
    state: TaskQueueState;
    addTask: (file: File, audioDuration?: number) => string;
    updateProgress: (taskId: string, progress: Partial<TaskProgress>) => void;
    completeTask: (taskId: string, result: TaskResult) => void;
    failTask: (taskId: string, error: string) => void;
    removeTask: (taskId: string) => void;
    clearCompleted: () => void;
    getTask: (taskId: string) => Task | undefined;
    getNextPendingTask: () => Task | undefined;
    startProcessing: (taskId: string) => void;
    // Files são armazenados separadamente (não serializam bem)
    getTaskFile: (taskId: string) => File | undefined;
}

const TaskQueueContext = createContext<TaskQueueContextType | null>(null);

// Provider
export function TaskQueueProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(taskReducer, initialState);
    const filesRef = useRef<Map<string, File>>(new Map());
    const isInitialized = useRef(false);

    // Carregar do localStorage na inicialização
    useEffect(() => {
        if (isInitialized.current) return;
        isInitialized.current = true;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.tasks && Array.isArray(parsed.tasks)) {
                    dispatch({ type: 'LOAD_FROM_STORAGE', payload: { tasks: parsed.tasks } });
                }
            }
        } catch (error) {
            console.error('Erro ao carregar tasks do storage:', error);
        }
    }, []);

    // Salvar no localStorage quando state muda
    useEffect(() => {
        if (!isInitialized.current) return;

        try {
            // Não salvar tasks com arquivos (não serializam)
            const tasksToSave = state.tasks.map(task => ({
                ...task,
                // Remove result.audioUrl pois é um blob URL
                result: task.result ? { ...task.result, audioUrl: undefined } : undefined,
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: tasksToSave }));
        } catch (error) {
            console.error('Erro ao salvar tasks no storage:', error);
        }
    }, [state.tasks]);

    // Funções do contexto
    const addTask = useCallback((file: File, audioDuration?: number): string => {
        const id = uuidv4();
        filesRef.current.set(id, file);
        dispatch({
            type: 'ADD_TASK',
            payload: {
                id,
                filename: file.name,
                fileSize: file.size,
                audioDuration,
                file,
            },
        });
        return id;
    }, []);

    const updateProgress = useCallback((taskId: string, progress: Partial<TaskProgress>) => {
        dispatch({ type: 'UPDATE_PROGRESS', payload: { taskId, progress } });
    }, []);

    const completeTask = useCallback((taskId: string, result: TaskResult) => {
        filesRef.current.delete(taskId);
        dispatch({ type: 'COMPLETE_TASK', payload: { taskId, result } });
    }, []);

    const failTask = useCallback((taskId: string, error: string) => {
        filesRef.current.delete(taskId);
        dispatch({ type: 'FAIL_TASK', payload: { taskId, error } });
    }, []);

    const removeTask = useCallback((taskId: string) => {
        filesRef.current.delete(taskId);
        dispatch({ type: 'REMOVE_TASK', payload: { taskId } });
    }, []);

    const clearCompleted = useCallback(() => {
        dispatch({ type: 'CLEAR_COMPLETED' });
    }, []);

    const getTask = useCallback((taskId: string) => {
        return state.tasks.find(task => task.id === taskId);
    }, [state.tasks]);

    const getNextPendingTask = useCallback(() => {
        return state.tasks.find(task => task.status === 'pending');
    }, [state.tasks]);

    const startProcessing = useCallback((taskId: string) => {
        dispatch({ type: 'START_TASK', payload: { taskId } });
    }, []);

    const getTaskFile = useCallback((taskId: string) => {
        return filesRef.current.get(taskId);
    }, []);

    const value: TaskQueueContextType = {
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
    };

    return (
        <TaskQueueContext.Provider value={value}>
            {children}
        </TaskQueueContext.Provider>
    );
}

// Hook para usar o contexto
export function useTaskQueueContext() {
    const context = useContext(TaskQueueContext);
    if (!context) {
        throw new Error('useTaskQueueContext deve ser usado dentro de TaskQueueProvider');
    }
    return context;
}
