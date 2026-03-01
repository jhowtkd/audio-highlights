'use client';

import { forwardRef, memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/format-utils';
import type { TranscriptionSegment, WordTimestamp } from '@/types';

interface KaraokeTranscriptPOCProps {
  segment: TranscriptionSegment;
  isActive: boolean;
  currentTime?: number;
  onSegmentClick: (startTime: number) => void;
  className?: string;
}

export const KaraokeTranscriptPOC = memo(forwardRef<HTMLDivElement, KaraokeTranscriptPOCProps>(
  ({ segment, isActive, currentTime = 0, onSegmentClick, className }, ref) => {

    // Memoize the rendered words to avoid re-computing the map unnecessarily
    // although with currentTime changing, this might re-render often if passed down.
    // Ideally, only the active segment receives currentTime updates.
    const renderedContent = useMemo(() => {
      // If no words available, fallback to text
      if (!segment.words || segment.words.length === 0) {
        return (
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
        );
      }

      return (
        <p className="text-sm leading-relaxed flex flex-wrap gap-x-1 gap-y-0.5">
          {segment.words.map((word, index) => {
            const isWordActive = isActive && currentTime >= word.start && currentTime <= word.end;
            const isPast = isActive && currentTime > word.end;

            return (
              <span
                key={`${segment.id}-word-${index}`}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent segment click
                  onSegmentClick(word.start);
                }}
                className={cn(
                  "cursor-pointer rounded px-0.5 transition-colors duration-100",
                  // Hover state
                  "hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300",
                  // Active state (Karaoke highlight)
                  isWordActive && "bg-blue-500 text-white font-bold shadow-sm scale-105 transform inline-block",
                  // Past state (optional: dim previous words slightly)
                  isPast && "text-slate-900 dark:text-slate-100",
                  // Future/Default state
                  !isWordActive && !isPast && (isActive ? "text-slate-700 dark:text-slate-300" : "text-slate-600 dark:text-slate-400")
                )}
                title={`${formatTime(word.start)} - ${formatTime(word.end)}`}
              >
                {word.word}
              </span>
            );
          })}
        </p>
      );
    }, [segment, isActive, currentTime, onSegmentClick]);

    return (
      <div
        ref={ref}
        onClick={() => onSegmentClick(segment.start)}
        className={cn(
          'p-3 rounded-lg cursor-pointer transition-all duration-200',
          isActive
            ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 shadow-sm'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 border-transparent',
          className
        )}
      >
        <div className="flex items-start gap-3">
          {/* Timestamp Badge */}
          <span
            className={cn(
              'text-xs font-mono px-2 py-1 rounded shrink-0 transition-colors',
              isActive
                ? 'bg-blue-500 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 group-hover:bg-slate-300 dark:group-hover:bg-slate-600'
            )}
          >
            {formatTime(segment.start)}
          </span>

          {/* Content */}
          <div className="flex-1">
             {renderedContent}
          </div>
        </div>
      </div>
    );
  }
));

KaraokeTranscriptPOC.displayName = 'KaraokeTranscriptPOC';
