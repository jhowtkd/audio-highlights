'use client';

import { Play, Clock, Copy, Download, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTime, formatDuration } from '@/lib/format-utils';
import { cn } from '@/lib/utils';
import type { GeneratedHighlight } from '@/types';

interface HighlightCardProps {
  highlight: GeneratedHighlight;
  index: number;
  onPlay: (startTime: number) => void;
  onExport: (highlight: GeneratedHighlight, format: 'srt' | 'txt') => void;
  onCopy: (text: string) => void;
  className?: string;
}

export function HighlightCard({
  highlight,
  index,
  onPlay,
  onExport,
  onCopy,
  className,
}: HighlightCardProps) {
  const scoreColor =
    highlight.relevanceScore >= 90
      ? 'text-green-600 dark:text-green-400'
      : highlight.relevanceScore >= 70
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-slate-600 dark:text-slate-400';

  return (
    <Card className={cn('border-slate-200 dark:border-slate-800 overflow-hidden', className)}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 shrink-0">
                #{index + 1}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {highlight.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {formatTime(highlight.startTime)} - {formatTime(highlight.endTime)}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>{formatDuration(highlight.duration)}</span>
                </div>
              </div>
            </div>

            <div className={cn('flex items-center gap-1 shrink-0', scoreColor)}>
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-bold">{highlight.relevanceScore}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Summary */}
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {highlight.summary}
          </p>

          {/* Transcript Preview */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
            <p className="text-sm text-slate-700 dark:text-slate-300 italic line-clamp-3">
              &ldquo;{highlight.transcript}&rdquo;
            </p>
          </div>

          {/* Tags */}
          {highlight.tags && highlight.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {highlight.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => onPlay(highlight.startTime)}
            className="flex-1 sm:flex-none"
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Play
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onCopy(highlight.transcript)}
            className="flex-1 sm:flex-none"
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copiar
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport(highlight, 'srt')}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            SRT
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport(highlight, 'txt')}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            TXT
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
