'use client';

import { useRef, useEffect } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { TranscriptSegment } from './transcript-segment';
import type { TranscriptionSegment } from '@/types';

interface VirtualizedTranscriptViewerPOCProps {
  segments: TranscriptionSegment[];
  activeSegmentIndex: number;
  onSegmentClick: (startTime: number) => void;
  className?: string;
}

export function VirtualizedTranscriptViewerPOC({
  segments,
  activeSegmentIndex,
  onSegmentClick,
  className,
}: VirtualizedTranscriptViewerPOCProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Auto-scroll to active segment
  useEffect(() => {
    if (virtuosoRef.current && activeSegmentIndex >= 0) {
      virtuosoRef.current.scrollToIndex({
        index: activeSegmentIndex,
        align: 'center',
        behavior: 'smooth',
      });
    }
  }, [activeSegmentIndex]);

  return (
    <div className={className}>
      <Virtuoso
        ref={virtuosoRef}
        style={{ height: '100%' }}
        data={segments}
        itemContent={(index, segment) => (
          <TranscriptSegment
            segment={segment}
            isActive={index === activeSegmentIndex}
            isMatch={false} // POC doesn't handle search matches yet
            onSegmentClick={onSegmentClick}
          />
        )}
      />
    </div>
  );
}
