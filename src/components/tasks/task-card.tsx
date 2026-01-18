'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    FileAudio,
    Trash2,
    Play,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatFileSize, formatDuration } from '@/lib/format-utils';
import { useTaskQueue } from '@/hooks/use-task-queue';
import type { Task } from '@/types/task-types';
import { cn } from '@/lib/utils';

interface TaskCardProps {
    task: Task;
}

const statusConfig = {
    pending: {
        icon: Clock,
        label: 'Na fila',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-900/50',
    },
    converting: {
        icon: RefreshCw,
        label: 'Convertendo',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/50',
    },
    transcribing: {
        icon: Loader2,
        label: 'Transcrevendo',
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-100 dark:bg-purple-900/50',
    },
    generating: {
        icon: Loader2,
        label: 'Gerando highlights',
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-100 dark:bg-indigo-900/50',
    },
    completed: {
        icon: CheckCircle,
        label: 'Concluído',
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/50',
    },
    error: {
        icon: AlertCircle,
        label: 'Erro',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/50',
    },
};

export function TaskCard({ task }: TaskCardProps) {
    const router = useRouter();
    const { removeTask } = useTaskQueue();

    const config = statusConfig[task.status];
    const StatusIcon = config.icon;
    const isProcessing = ['converting', 'transcribing', 'generating'].includes(task.status);

    const handleViewResult = () => {
        // TODO: Navegar para página de resultado com a task
        router.push(`/tasks/${task.id}`);
    };

    return (
        <div className={cn(
            "bg-white dark:bg-slate-900 rounded-xl border p-4 transition-all",
            task.status === 'error'
                ? "border-red-200 dark:border-red-800"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
        )}>
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                    <FileAudio className="h-6 w-6 text-slate-500" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                {task.filename}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                <span>{formatFileSize(task.fileSize)}</span>
                                {task.audioDuration && (
                                    <>
                                        <span>•</span>
                                        <span>{formatDuration(task.audioDuration)}</span>
                                    </>
                                )}
                                <span>•</span>
                                <span>
                                    {formatDistanceToNow(task.createdAt, { addSuffix: true, locale: ptBR })}
                                </span>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium shrink-0",
                            config.bg,
                            config.color
                        )}>
                            <StatusIcon className={cn("h-4 w-4", isProcessing && "animate-spin")} />
                            <span>{config.label}</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {isProcessing && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1.5">
                                <span className="text-slate-600 dark:text-slate-400">
                                    {task.progress.message}
                                </span>
                                <span className="text-slate-500 font-medium">
                                    {task.progress.percent}%
                                </span>
                            </div>
                            <Progress value={task.progress.percent} className="h-2" />
                        </div>
                    )}

                    {/* Error Message */}
                    {task.status === 'error' && task.error && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {task.error}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                        {task.status === 'completed' && (
                            <Button size="sm" onClick={handleViewResult}>
                                <Play className="h-4 w-4 mr-1.5" />
                                Ver Resultado
                                <ArrowRight className="h-4 w-4 ml-1.5" />
                            </Button>
                        )}

                        {(task.status === 'completed' || task.status === 'error' || task.status === 'pending') && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeTask(task.id)}
                                className="text-slate-500 hover:text-red-600"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
