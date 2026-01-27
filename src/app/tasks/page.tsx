'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mic, Plus, Trash2, ArrowLeft, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/tasks/task-list';
import { UploadDialog } from '@/components/tasks/upload-dialog';
import { useTaskQueue } from '@/hooks/use-task-queue';

export default function TasksPage() {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const { tasks, pendingCount, completedCount, errorCount, isProcessing, clearCompleted } = useTaskQueue();

    const processingCount = tasks.filter(t =>
        ['converting', 'transcribing', 'generating'].includes(t.status)
    ).length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                    AudioHighlights
                                </span>
                            </Link>
                            <span className="text-slate-400">/</span>
                            <span className="text-lg font-medium text-slate-600 dark:text-slate-400">
                                Tasks
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <Button onClick={() => setUploadDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Upload
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Stats Bar */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            {/* Processing */}
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded">
                                    <Loader2 className={`h-4 w-4 text-blue-600 dark:text-blue-400 ${isProcessing ? 'animate-spin' : ''}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Processando</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{processingCount}</p>
                                </div>
                            </div>

                            {/* Pending */}
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded">
                                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Na fila</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{pendingCount}</p>
                                </div>
                            </div>

                            {/* Completed */}
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded">
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Concluídas</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{completedCount}</p>
                                </div>
                            </div>

                            {/* Errors */}
                            {errorCount > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded">
                                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Erros</p>
                                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{errorCount}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {completedCount > 0 && (
                            <Button variant="outline" size="sm" onClick={clearCompleted}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Limpar concluídas
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {tasks.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-16">
                        <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Mic className="h-8 w-8 text-slate-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            Sua biblioteca está vazia
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Envie um arquivo de áudio para gerar transcrições e highlights.
                        </p>
                        <Button onClick={() => setUploadDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Upload
                        </Button>
                    </div>
                ) : (
                    <TaskList tasks={tasks} />
                )}
            </main>

            {/* Upload Dialog */}
            <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
        </div>
    );
}
