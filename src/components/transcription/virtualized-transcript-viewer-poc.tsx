'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { TranscriptSegment } from './transcript-segment';
import type { TranscriptionSegment } from '@/types';

interface POCVirtuosoContext {
  activeSegmentIndex: number;
  onSegmentClick: (startTime: number) => void;
}

// ✅ Performance Optimization: Extract itemContent outside component
// Performance: Prevents react-virtuoso from unmounting and remounting items on every render
// by providing a stable function reference. Dynamic data is passed via context.
const renderPOCSegment = (
  index: number,
  segment: TranscriptionSegment,
  context: POCVirtuosoContext
) => {
  return (
    <TranscriptSegment
      segment={segment}
      isActive={index === context.activeSegmentIndex}
      isMatch={false} // POC doesn't handle search matches yet
      onSegmentClick={context.onSegmentClick}
    />
  );
};


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

  // Memoize Virtuoso context to prevent unnecessary re-renders of all visible items
  const virtuosoContext = useMemo<POCVirtuosoContext>(() => ({
    activeSegmentIndex,
    onSegmentClick
  }), [activeSegmentIndex, onSegmentClick]);

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
      <Virtuoso<TranscriptionSegment, POCVirtuosoContext>
        ref={virtuosoRef}
        style={{ height: '100%' }}
        data={segments}
        context={virtuosoContext}
        itemContent={renderPOCSegment}
      />
    </div>
  );
}
