'use client';

import { useState, useCallback } from 'react';
import { Mic, Sparkles, FileText } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Dropzone } from '@/components/upload/dropzone';
import { AudioPlayer } from '@/components/audio/player';
import { TranscriptViewer } from '@/components/transcription/transcript-viewer';
import { ConfigPanel } from '@/components/highlights/config-panel';
import { HighlightList } from '@/components/highlights/highlight-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import type { Transcription, GeneratedHighlight, HighlightConfig, TranscriptionSegment } from '@/types';

type AppStep = 'upload' | 'transcribing' | 'transcribed' | 'generating' | 'completed';

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
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [seekTo, setSeekTo] = useState<number | undefined>(undefined);
  const [transcriptionProgress, setTranscriptionProgress] = useState<number>(0);

  const handleFileAccepted = useCallback(async (file: File, duration: number) => {
    setAudioFile(file);
    setAudioDuration(duration);
    setAudioUrl(URL.createObjectURL(file));
    setStep('transcribing');
    setTranscriptionProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', crypto.randomUUID());

      setTranscriptionProgress(30);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      setTranscriptionProgress(80);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro na transcrição');
      }

      const data = await response.json();
      setTranscriptionProgress(100);
      setTranscription(data.transcription);
      setStep('transcribed');
      toast.success('Transcrição concluída!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao transcrever o áudio');
      setStep('upload');
    }
  }, []);

  const handleGenerateHighlights = useCallback(async (config: HighlightConfig) => {
    if (!transcription) return;

    setStep('generating');

    try {
      const response = await fetch('/api/highlights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          segments: transcription.segments,
          config,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar highlights');
      }

      const data = await response.json();
      setHighlights(data.highlights);
      setHighlightStats(data.stats);
      setStep('completed');
      toast.success(`${data.highlights.length} highlights gerados!`);
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar highlights');
      setStep('transcribed');
    }
  }, [transcription]);

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

  const handleReset = useCallback(() => {
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
  }, [audioUrl]);

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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Step */}
        {step === 'upload' && (
          <div className="max-w-2xl mx-auto">
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
            <Progress value={transcriptionProgress} className="max-w-xs mx-auto" />
            <p className="text-sm text-slate-500 mt-3">
              Isso pode levar alguns minutos dependendo do tamanho do arquivo
            </p>
          </div>
        )}

        {/* Transcribed / Generating / Completed Steps */}
        {(step === 'transcribed' || step === 'generating' || step === 'completed') && (
          <div className="space-y-6">
            {/* Audio Player */}
            {audioUrl && (
              <AudioPlayer
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                seekTo={seekTo}
                className="max-w-4xl mx-auto"
              />
            )}

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Transcription */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="transcription" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="transcription">
                      <FileText className="h-4 w-4 mr-2" />
                      Transcrição
                    </TabsTrigger>
                    <TabsTrigger value="highlights" disabled={highlights.length === 0}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Highlights ({highlights.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="transcription">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      {transcription && (
                        <TranscriptViewer
                          segments={transcription.segments}
                          currentTime={currentTime}
                          onSegmentClick={handleSegmentClick}
                          className="h-[500px]"
                        />
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="highlights">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <HighlightList
                        highlights={highlights}
                        segments={transcription?.segments || []}
                        stats={highlightStats || undefined}
                        onPlay={handlePlayHighlight}
                      />
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
