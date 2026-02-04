'use client';

import { forwardRef, memo } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/format-utils';
import type { TranscriptionSegment } from '@/types';

interface TranscriptSegmentProps {
  segment: TranscriptionSegment;
  isActive: boolean;
  isMatch: boolean;
  onSegmentClick: (startTime: number) => void;
}

export const TranscriptSegment = memo(forwardRef<HTMLButtonElement, TranscriptSegmentProps>(
  ({ segment, isActive, isMatch, onSegmentClick }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => onSegmentClick(segment.start)}
        className={cn(
          'w-full text-left p-3 rounded-lg cursor-pointer transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
          isActive
            ? 'bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500'
            : isMatch
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 border-transparent'
        )}
      >
        <span className="flex items-start gap-3">
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

          <span
            className={cn(
              'text-sm leading-relaxed block',
              isActive
                ? 'text-slate-900 dark:text-slate-100 font-medium'
                : 'text-slate-700 dark:text-slate-300'
            )}
          >
            {segment.text}
          </span>
        </span>
      </button>
    );
  }
));

TranscriptSegment.displayName = 'TranscriptSegment';
