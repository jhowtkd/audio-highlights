'use client';

import { useState, useCallback, useEffect, use, useRef, ChangeEvent, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Mic,
    Sparkles,
    FileText,
    ArrowLeft,
    Film,
    X,
    AlertCircle,
    Loader2,
    RefreshCw,
    Scissors,
} from 'lucide-react';
import { DecupagemView } from '@/components/decupagem/decupagem-view';
import { ThemeToggle } from '@/components/theme-toggle';
import { Toaster, toast } from 'sonner';
import { AudioPlayer } from '@/components/audio/player';
import { TranscriptViewer } from '@/components/transcription/transcript-viewer';
import { ConfigPanel } from '@/components/highlights/config-panel';
import { HighlightList } from '@/components/highlights/highlight-list';
import { EpisodeSummary } from '@/components/highlights/episode-summary';
import { Waveform } from '@/components/audio/waveform';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useTaskQueue } from '@/hooks/use-task-queue';
import { useTaskQueueContext } from '@/contexts/task-context';
import { useFFmpeg } from '@/hooks/use-ffmpeg';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { downloadFile } from '@/lib/export';
import { findActiveSegmentIndex } from '@/lib/transcription-utils';
import type { GeneratedHighlight, HighlightConfig, EpisodeAnalysis } from '@/types';

interface HighlightStats {
    totalDuration: number;
    averageDuration: number;
    coveragePercent: number;
}

interface TaskPageParams {
    id: string;
}

export default function TaskDetailPage({ params }: { params: Promise<TaskPageParams> }) {
    const { id } = use(params);
    const router = useRouter();
    const { getTask, tasks, retryTask } = useTaskQueue();
    const { updateResult } = useTaskQueueContext();
    const { cutVideo, cutMixVideo } = useFFmpeg();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isRetranscribeDialogOpen, setIsRetranscribeDialogOpen] = useState(false);

    const [task, setTask] = useState(() => getTask(id));

    const handleRetranscribe = () => {
        if (!task) return;
        setIsRetranscribeDialogOpen(true);
    };

    const confirmRetranscribe = () => {
        if (!task) return;
        // Tenta reprocessar. Se retornar false (arquivo não encontrado), pede o arquivo
        const success = retryTask(task.id);
        if (!success) {
            // Arquivo não está na memória, abrir seletor
            fileInputRef.current?.click();
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !task) return;

        retryTask(task.id, file);

        // Limpar input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    const [highlights, setHighlights] = useState<GeneratedHighlight[]>([]);
    const [highlightStats, setHighlightStats] = useState<HighlightStats | null>(null);
    const [episodeAnalysis, setEpisodeAnalysis] = useState<EpisodeAnalysis | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [seekTo, setSeekTo] = useState<number | undefined>(undefined);
    const [activeTab, setActiveTab] = useState('transcription');
    const [videoFile, setVideoFile] = useState<File | null>(null);

    const activeSegmentIndex = useMemo(() => {
        if (!task?.result?.transcription?.segments) return -1;
        return findActiveSegmentIndex(task.result.transcription.segments, currentTime);
    }, [task, currentTime]);

    // Atualiza task quando o estado muda
    useEffect(() => {
        const updatedTask = tasks.find(t => t.id === id);
        if (updatedTask) {
            setTask(updatedTask);
        }
    }, [tasks, id]);

    // Carrega highlights salvos do result da task
    useEffect(() => {
        if (task?.result?.highlights && task.result.highlights.length > 0 && highlights.length === 0) {
            setHighlights(task.result.highlights);
            if (task.result.episodeAnalysis) {
                setEpisodeAnalysis(task.result.episodeAnalysis);
            }
        }
    }, [task?.result?.highlights, task?.result?.episodeAnalysis, highlights.length]);

    // Muda para a tab de highlights quando são gerados
    useEffect(() => {
        if (highlights.length > 0) {
            setActiveTab('highlights');
        }
    }, [highlights]);

    const handleTimeUpdate = useCallback((time: number) => {
        setCurrentTime(time);
        setSeekTo(undefined);
    }, []);

    const handleSegmentClick = useCallback((startTime: number) => {
        setSeekTo(startTime);
    }, []);

    const handlePlayHighlight = useCallback((startTime: number) => {
        setSeekTo(startTime);
    }, []);

    const handleGenerateHighlights = useCallback(async (config: HighlightConfig) => {
        if (!task?.result?.transcription) {
            toast.error('Transcrição não encontrada');
            return;
        }

        setIsGenerating(true);
        toast.info('Gerando highlights...');

        try {
            const response = await fetch('/api/highlights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    segments: task.result.transcription.segments.map((segment) => {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { words, ...rest } = segment;
                        return rest;
                    }),
                    config: {
                        ...config,
                        episodeTitle: task.filename.replace(/\.[^/.]+$/, ''), // Remove extensão
                    },
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao gerar highlights');
            }

            const data = await response.json();
            setHighlights(data.highlights);
            setHighlightStats(data.stats);
            setEpisodeAnalysis(data.episodeAnalysis || null);

            // Salva highlights no result da task para persistência
            updateResult(id, {
                highlights: data.highlights,
                episodeAnalysis: data.episodeAnalysis || null,
                highlightConfig: config,
            });

            toast.success(`${data.highlights.length} highlights gerados!`);
        } catch (error) {
            console.error('Erro:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao gerar highlights');
        } finally {
            setIsGenerating(false);
        }
    }, [task, id, updateResult]);

    const handleDownloadVideo = useCallback(async (highlight: GeneratedHighlight) => {
        if (!videoFile) return;

        const safeTitle = highlight.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${safeTitle}.mp4`;

        // Check if this is a Mix mode highlight (has segments array)
        const isMixMode = highlight.segments && highlight.segments.length > 0;

        if (isMixMode) {
            // Mix mode: cut and concatenate multiple segments
            toast.promise(
                cutMixVideo(videoFile, highlight.segments!),
                {
                    loading: `Processando mix com ${highlight.segments!.length} segmentos...`,
                    success: (blob) => {
                        downloadFile(blob, filename);
                        return 'Mix baixado com sucesso!';
                    },
                    error: (err) => `Erro ao criar mix: ${err.message}`
                }
            );
        } else {
            // Standard mode: simple cut
            toast.promise(
                cutVideo(videoFile, highlight.startTime, highlight.endTime),
                {
                    loading: 'Cortando vídeo...',
                    success: (blob) => {
                        downloadFile(blob, filename);
                        return 'Vídeo baixado com sucesso!';
                    },
                    error: 'Erro ao cortar vídeo'
                }
            );
        }
    }, [videoFile, cutVideo, cutMixVideo]);

    const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file);
            toast.success(`Vídeo "${file.name}" anexado!`);
        } else if (file) {
            toast.error('Por favor, selecione um arquivo de vídeo (MP4, MOV)');
        }
    }, []);

    const handleRemoveVideo = useCallback(() => {
        setVideoFile(null);
        toast.info('Vídeo removido');
    }, []);

    // Loading state
    if (!task) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <Toaster position="top-right" richColors />
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-slate-600 dark:text-slate-400">Carregando projeto...</p>
                </div>
            </div>
        );
    }

    // Task não encontrada ou não concluída
    if (task.status !== 'completed' || !task.result) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
                <Toaster position="top-right" richColors />
                <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-4">
                                <Link href="/tasks" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                        <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                        AudioHighlights
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRetranscribe}
                                    className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                                    title="Retranscrever arquivo"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Retranscrever
                                </Button>
                                <ThemeToggle />

                                {/* Hidden file input for restoration */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept="audio/*,video/*"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            Projeto não disponível
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            {task.status === 'error'
                                ? `Erro: ${task.error}`
                                : 'Este projeto ainda não foi processado ou não existe.'}
                        </p>
                        <Button onClick={() => router.push('/tasks')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar para Projetos
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    const { transcription, audioUrl, audioDuration } = task.result;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/tasks" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                    AudioHighlights
                                </span>
                            </div>
                            <span className="text-slate-400">/</span>
                            <span className="text-lg font-medium text-slate-600 dark:text-slate-400 truncate max-w-[300px]">
                                {task.filename}
                            </span>
                        </div>

                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    {/* Audio Player */}
                    {audioUrl && (
                        <div className="max-w-4xl mx-auto space-y-4">
                            <AudioPlayer
                                src={audioUrl}
                                onTimeUpdate={handleTimeUpdate}
                                seekTo={seekTo}
                            />

                            {/* Waveform Visualizer */}
                            <Waveform
                                audioUrl={audioUrl}
                                duration={audioDuration || 0}
                                currentTime={currentTime}
                                highlights={highlights}
                                segments={transcription?.segments}
                                onSeek={(time) => setSeekTo(time)}
                            />
                        </div>
                    )}

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Transcription */}
                        <div className="lg:col-span-2">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="transcription">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Transcrição
                                    </TabsTrigger>
                                    <TabsTrigger value="highlights" disabled={highlights.length === 0}>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Highlights ({highlights.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="decupagem" disabled={!transcription}>
                                        <Scissors className="h-4 w-4 mr-2" />
                                        Decupagem
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="transcription">
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                                        {transcription && (
                                            <TranscriptViewer
                                                segments={transcription.segments}
                                                activeSegmentIndex={activeSegmentIndex}
                                                onSegmentClick={handleSegmentClick}
                                                className="h-[500px]"
                                            />
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="highlights">
                                    {/* Video Attach Section */}
                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-xl border border-purple-200 dark:border-purple-800 p-4 mb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Film className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-slate-100">
                                                        {videoFile ? videoFile.name : 'Quer gerar clipes de vídeo?'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {videoFile
                                                            ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB`
                                                            : 'Anexe o vídeo correspondente a este áudio para baixar os cortes'}
                                                    </p>
                                                </div>
                                            </div>
                                            {videoFile ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleRemoveVideo}
                                                    className="text-red-500 hover:text-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <label>
                                                    <input
                                                        type="file"
                                                        accept="video/mp4,video/quicktime"
                                                        onChange={handleVideoSelect}
                                                        className="hidden"
                                                    />
                                                    <Button asChild variant="outline" size="sm" className="cursor-pointer">
                                                        <span>
                                                            <Film className="h-4 w-4 mr-1.5" />
                                                            Anexar Vídeo
                                                        </span>
                                                    </Button>
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* Episode Summary */}
                                    {episodeAnalysis && (
                                        <EpisodeSummary analysis={episodeAnalysis} className="mb-4" />
                                    )}

                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                                        <HighlightList
                                            highlights={highlights}
                                            segments={transcription?.segments || []}
                                            stats={highlightStats || undefined}
                                            onPlay={handlePlayHighlight}
                                            onDownloadVideo={videoFile ? handleDownloadVideo : undefined}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="decupagem">
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1 h-[600px]">
                                        {transcription && (
                                            <DecupagemView
                                                segments={transcription.segments}
                                                projectId={task.id}
                                            />
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Right Column - Config Panel */}
                        <div className="lg:col-span-1">
                            <ConfigPanel
                                onGenerate={handleGenerateHighlights}
                                isGenerating={isGenerating}
                                audioDuration={audioDuration || 0}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-center text-sm text-slate-500">
                        AudioHighlights - Transforme seus podcasts em clips virais com IA
                    </p>
                </div>
            </footer>

            <ConfirmDialog
                open={isRetranscribeDialogOpen}
                onOpenChange={setIsRetranscribeDialogOpen}
                title="Retranscrever arquivo?"
                message="Tem certeza que deseja retranscrever este arquivo? Isso irá apagar os resultados atuais e gastar créditos novamente."
                confirmLabel="Retranscrever"
                cancelLabel="Cancelar"
                confirmVariant="destructive"
                onConfirm={confirmRetranscribe}
            />
        </div>
    );
}
