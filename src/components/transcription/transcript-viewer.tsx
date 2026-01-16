'use client';

import { useRef, useEffect } from 'react';
import { formatTime } from '@/lib/format-utils';
import { cn } from '@/lib/utils';
import type { TranscriptionSegment } from '@/types';

interface TranscriptViewerProps {
  segments: TranscriptionSegment[];
  currentTime: number;
  onSegmentClick: (startTime: number) => void;
  className?: string;
}

export function TranscriptViewer({
  segments,
  currentTime,
  onSegmentClick,
  className,
}: TranscriptViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Encontra o segmento ativo baseado no tempo atual
  const activeSegmentIndex = segments.findIndex(
    (segment) => currentTime >= segment.start && currentTime < segment.end
  );

  // Auto-scroll para o segmento ativo
  useEffect(() => {
    if (activeSegmentRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeElement = activeSegmentRef.current;

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();

      const isVisible =
        activeRect.top >= containerRect.top &&
        activeRect.bottom <= containerRect.bottom;

      if (!isVisible) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeSegmentIndex]);

  if (segments.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 text-slate-500', className)}>
        Nenhuma transcrição disponível
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700',
        className
      )}
    >
      {segments.map((segment, index) => {
        const isActive = index === activeSegmentIndex;

        return (
          <div
            key={segment.id}
            ref={isActive ? activeSegmentRef : null}
            onClick={() => onSegmentClick(segment.start)}
            className={cn(
              'p-3 rounded-lg cursor-pointer transition-all duration-200',
              isActive
                ? 'bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 border-transparent'
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'text-xs font-mono px-2 py-1 rounded shrink-0',
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                )}
              >
                {formatTime(segment.start)}
              </span>

              <p
                className={cn(
                  'text-sm leading-relaxed',
                  isActive
                    ? 'text-slate-900 dark:text-slate-100 font-medium'
                    : 'text-slate-700 dark:text-slate-300'
                )}
              >
                {segment.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
