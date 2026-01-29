'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Mic, Sparkles, FileText, ListTodo } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Toaster } from 'sonner';
import { Dropzone } from '@/components/upload/dropzone';
import { useTaskQueue } from '@/hooks/use-task-queue';
import { CostEstimator } from '@/components/upload/cost-estimator';

type AppStep = 'upload';

export default function Home() {
  const [step] = useState<AppStep>('upload');
  const [pendingFile, setPendingFile] = useState<{ file: File; duration: number } | null>(null);

  // Task Queue hook
  const { addTaskAndNavigate } = useTaskQueue();

  const handleFileAccepted = useCallback((file: File, duration: number) => {
    // Show cost estimator before proceeding
    setPendingFile({ file, duration });
  }, []);

  const handleConfirmCost = useCallback(() => {
    if (pendingFile) {
      addTaskAndNavigate(pendingFile.file, pendingFile.duration);
      setPendingFile(null);
    }
  }, [pendingFile, addTaskAndNavigate]);

  const handleCancelCost = useCallback(() => {
    setPendingFile(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                AudioHighlights
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/tasks"
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <ListTodo className="h-4 w-4" />
                Tasks
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Step */}
        {step === 'upload' && (
          <div className="max-w-2xl mx-auto">
            {pendingFile ? (
              <CostEstimator
                file={pendingFile.file}
                duration={pendingFile.duration}
                onConfirm={handleConfirmCost}
                onCancel={handleCancelCost}
              />
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                    Transforme seu podcast em highlights
                  </h1>
                  <p className="text-lg text-slate-600 dark:text-slate-400">
                    Faça upload do seu áudio e deixe a IA identificar os melhores momentos
                  </p>
                </div>

                <Dropzone onFileAccepted={handleFileAccepted} />

                {/* Features */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6">
                    <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                      <Mic className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Transcrição Automática
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Powered by OpenAI Whisper com timestamps precisos
                    </p>
                  </div>

                  <div className="text-center p-6">
                    <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                      <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Highlights Inteligentes
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      IA identifica os melhores momentos para clips virais
                    </p>
                  </div>

                  <div className="text-center p-6">
                    <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Exportação Fácil
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Exporte em SRT para legendas ou texto para redes sociais
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-500">
            AudioHighlights - Transforme seus podcasts em clips virais com IA
          </p>
        </div>
      </footer>
    </div>
  );
}
