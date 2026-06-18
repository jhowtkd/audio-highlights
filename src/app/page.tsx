'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Mic, Sparkles, FileText, AlertCircle, Timer, Film, X, ListTodo, Scissors } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { Toaster, toast } from 'sonner';
import { Dropzone } from '@/components/upload/dropzone';
import { AudioPlayer } from '@/components/audio/player';
import { TranscriptViewer } from '@/components/transcription/transcript-viewer';
import { ConfigPanel } from '@/components/highlights/config-panel';
import { HighlightList } from '@/components/highlights/highlight-list';
import { EpisodeSummary } from '@/components/highlights/episode-summary';
import { Waveform } from '@/components/audio/waveform';
import { DecupagemView } from '@/components/decupagem/decupagem-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ERROR_MESSAGES } from '@/lib/constants';
import { formatDuration } from '@/lib/format-utils';
import { useFFmpeg } from '@/hooks/use-ffmpeg';
import { useTaskQueue } from '@/hooks/use-task-queue';
import { CostEstimator } from '@/components/upload/cost-estimator';
import { downloadFile } from '@/lib/export';
import { findActiveSegmentIndex } from '@/lib/transcription-utils';
import type { Transcription, GeneratedHighlight, HighlightConfig, EpisodeAnalysis } from '@/types';

type AppStep = 'upload' | 'transcribing' | 'transcribed' | 'generating' | 'completed' | 'error';

interface HighlightStats {
  totalDuration: number;
  averageDuration: number;
  coveragePercent: number;
}

export default function Home() {
  const [step, setStep] = useState<AppStep>('upload');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [highlights, setHighlights] = useState<GeneratedHighlight[]>([]);
  const [highlightStats, setHighlightStats] = useState<HighlightStats | null>(null);
  const [episodeAnalysis, setEpisodeAnalysis] = useState<EpisodeAnalysis | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [seekTo, setSeekTo] = useState<number | undefined>(undefined);
  const [transcriptionProgress, setTranscriptionProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('transcription');
  const [statusMessage] = useState<string>('');

  // Timer states
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // FFmpeg hook
  const { cutVideo, cutMixVideo, isProcessing: isFFmpegProcessing, progress: ffmpegProgress, message: ffmpegMessage } = useFFmpeg();

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const activeSegmentIndex = useMemo(() => {
    if (!transcription?.segments) return -1;
    return findActiveSegmentIndex(transcription.segments, currentTime);
  }, [transcription?.segments, currentTime]);

  // Muda para a tab de highlights quando são gerados
  useEffect(() => {
    if (highlights.length > 0) {
      setActiveTab('highlights');
    }
  }, [highlights]);

  // Cleanup Object URL on unmount or when audioUrl changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [audioUrl]);

  // Timer logic for transcription
  useEffect(() => {
    if (step === 'transcribing') {
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(seconds);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (step === 'upload') {
        setElapsedTime(0);
      }
    }
  }, [step]);

  // Cost Estimator state
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

  const handleDownloadVideo = useCallback(async (highlight: GeneratedHighlight) => {
    if (!videoFile) return;

    // Use highlight title for filename
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

  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    setStep('upload');
    setTranscriptionProgress(0);
  }, []);

  const handleGenerateHighlights = useCallback(async (config: HighlightConfig) => {
    console.log('🖱️ handleGenerateHighlights acionado', { config, hasTranscription: !!transcription });

    if (!transcription) {
      console.error('❌ Transcrição ausente ao tentar gerar highlights');
      toast.error('Erro: Transcrição não encontrada. Tente recarregar.');
      return;
    }

    setStep('generating');
    toast.info('Iniciando geração de highlights...');

    try {
      const response = await fetch('/api/highlights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          segments: transcription.segments,
          config: {
            ...config,
            episodeTitle: audioFile?.name.replace(/\.[^/.]+$/, '') || 'Episódio',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || ERROR_MESSAGES.HIGHLIGHTS_FAILED);
      }

      const data = await response.json();
      setHighlights(data.highlights);
      setHighlightStats(data.stats);
      setEpisodeAnalysis(data.episodeAnalysis || null);
      setStep('completed');
      toast.success(`${data.highlights.length} highlights gerados!`);
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.HIGHLIGHTS_FAILED);
      setStep('transcribed');
    }
  }, [transcription, audioFile?.name]);

  const handleSegmentClick = useCallback((startTime: number) => {
    setSeekTo(startTime);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    setSeekTo(undefined);
  }, []);

  const handlePlayHighlight = useCallback((startTime: number) => {
    setSeekTo(startTime);
  }, []);

  const performReset = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setStep('upload');
    setAudioFile(null);
    setAudioUrl(null);
    setAudioDuration(0);
    setTranscription(null);
    setHighlights([]);
    setHighlightStats(null);
    setCurrentTime(0);
    setSeekTo(undefined);
    setTranscriptionProgress(0);
    setErrorMessage(null);
    setActiveTab('transcription');
  }, [audioUrl]);

  const handleReset = useCallback(() => {
    // Confirm before resetting if there's content
    if (transcription || highlights.length > 0) {
      setShowResetConfirm(true);
      return;
    }
    performReset();
  }, [transcription, highlights.length, performReset]);

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
                Meus Projetos
              </Link>
              <ThemeToggle />
              {step !== 'upload' && (
                <button
                  onClick={handleReset}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Novo projeto
                </button>
              )}
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

        {/* Transcribing Step */}
        {step === 'transcribing' && (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="animate-pulse mb-6">
              <Mic className="h-16 w-16 mx-auto text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Transcrevendo seu áudio...
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {audioFile?.name}
            </p>
            {isFFmpegProcessing ? (
              // Show FFmpeg progress if active
              <div className="flex flex-col items-center gap-1 text-sm text-slate-500 mb-4">
                <p className="font-medium text-purple-600 animate-pulse">{ffmpegMessage} ({ffmpegProgress}%)</p>
                <Progress value={ffmpegProgress} className="max-w-xs mx-auto" />
              </div>
            ) : (
              <>
                <Progress value={transcriptionProgress} className="max-w-xs mx-auto mb-4" />

                <div className="flex flex-col items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                  {statusMessage && (
                    <p className="font-medium text-blue-600 dark:text-blue-400 mb-2 animate-pulse">{statusMessage}</p>
                  )}
                  <div className="flex items-center gap-2 font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    <Timer className="h-4 w-4" />
                    <span>{formatDuration(elapsedTime)}</span>
                  </div>
                  <p className="mt-2 text-xs">
                    O processamento pode levar alguns minutos.
                  </p>
                  <p className="text-xs opacity-70">Mantenha esta aba aberta</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Não foi possível processar
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {errorMessage || 'Tivemos um problema técnico. Por favor, tente novamente.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRetry} variant="default">
                Tentar novamente
              </Button>
              <Button onClick={handleReset} variant="outline">
                Começar novo projeto
              </Button>
            </div>
          </div>
        )}

        {/* Transcribed / Generating / Completed Steps */}
        {(step === 'transcribed' || step === 'generating' || step === 'completed') && (
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
                  duration={audioDuration}
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
                          projectId={transcription.projectId || 'temp-project'}
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
                  isGenerating={step === 'generating'}
                  audioDuration={audioDuration}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Novo projeto?"
        message="Deseja realmente descartar este projeto? Todo o progresso será perdido."
        confirmLabel="Descartar"
        confirmVariant="destructive"
        onConfirm={performReset}
      />

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
