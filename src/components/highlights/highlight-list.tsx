'use client';

import { memo } from 'react';
import { Download, Clock, Percent, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { HighlightCard } from './highlight-card';
import { formatDuration } from '@/lib/format-utils';
import type { GeneratedHighlight, TranscriptionSegment } from '@/types';
import { generateSRT, generateMarkdown, downloadFile } from '@/lib/export';

interface HighlightListProps {
  highlights: GeneratedHighlight[];
  segments: TranscriptionSegment[];
  stats?: {
    totalDuration: number;
    averageDuration: number;
    coveragePercent: number;
  };
  onPlay: (startTime: number) => void;
  onDownloadVideo?: (highlight: GeneratedHighlight) => void;
}

export const HighlightList = memo(function HighlightList({ highlights, segments, stats, onPlay, onDownloadVideo }: HighlightListProps) {
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Texto copiado!', {
        icon: <Check className="h-4 w-4" />,
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar texto');
    }
  };

  const handleExport = (highlight: GeneratedHighlight, format: 'srt' | 'txt') => {
    const content = format === 'srt'
      ? generateSRT(highlight, segments)
      : generateMarkdown(highlight);

    const filename = `${highlight.title.replace(/[^a-z0-9]/gi, '_')}.${format === 'srt' ? 'srt' : 'txt'}`;

    downloadFile(content, filename);
    toast.success(`Arquivo ${filename} baixado!`, { duration: 2000 });
  };

  const handleExportAll = (format: 'srt' | 'txt') => {
    const contents = highlights.map((h, i) => {
      return format === 'srt'
        ? `# Highlight ${i + 1}: ${h.title}\n\n${generateSRT(h, segments)}`
        : generateMarkdown(h);
    });

    const content = contents.join('\n\n---\n\n');
    const filename = `all_highlights.${format === 'srt' ? 'srt' : 'md'}`;

    downloadFile(content, filename);
    toast.success(`${highlights.length} highlights exportados!`, { duration: 2000 });
  };

  if (highlights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Sparkles className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Pronto para encontrar os melhores momentos</h3>
        <p className="text-sm mt-2 text-center max-w-sm">
          Configure os parâmetros e clique em &quot;Gerar Highlights&quot; para começar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      {stats && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="font-bold text-2xl text-slate-900 dark:text-slate-100">
                {highlights.length}
              </span>
              <span>highlights</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Clock className="h-4 w-4" />
              <span>
                Total: <span className="font-medium">{formatDuration(stats.totalDuration)}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Percent className="h-4 w-4" />
              <span>
                Cobertura: <span className="font-medium">{stats.coveragePercent}%</span>
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleExportAll('srt')}>
              <Download className="h-4 w-4 mr-1.5" />
              Exportar Todos (SRT)
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExportAll('txt')}>
              <Download className="h-4 w-4 mr-1.5" />
              Exportar Todos (MD)
            </Button>
          </div>
        </div>
      )}

      {/* Highlight Cards */}
      <div className="space-y-4">
        {highlights.map((highlight, index) => (
          <HighlightCard
            key={highlight.id}
            highlight={highlight}
            index={index}
            onPlay={onPlay}
            onExport={handleExport}
            onCopy={handleCopy}
            onDownloadVideo={onDownloadVideo}
          />
        ))}
      </div>
    </div>
  );
});
