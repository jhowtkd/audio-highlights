'use client';

import { memo, type RefObject } from 'react';
import type { TranscriptionSegment } from '@/types';
import { TranscriptSegment } from './transcript-segment';

interface TranscriptChunkProps {
  segments: TranscriptionSegment[];
  startIndex: number;
  endIndex: number;
  activeSegmentIndex: number;
  matchingSegmentIds: Set<string>;
  onSegmentClick: (startTime: number) => void;
  activeSegmentRef: RefObject<HTMLButtonElement | null>;
}

export const TranscriptChunk = memo(
  ({
    segments,
    startIndex,
    endIndex,
    activeSegmentIndex,
    matchingSegmentIds,
    onSegmentClick,
    activeSegmentRef,
  }: TranscriptChunkProps) => {
    // Only slice what we need for this chunk
    // Use a for loop or slice map. Slice is cleaner.
    const chunkSegments = segments.slice(startIndex, endIndex);

    return (
      <>
        {chunkSegments.map((segment, index) => {
          const globalIndex = startIndex + index;
          const isActive = globalIndex === activeSegmentIndex;
          const isMatch = matchingSegmentIds.has(segment.id);

          return (
            <TranscriptSegment
              key={segment.id}
              ref={isActive ? activeSegmentRef : null}
              segment={segment}
              isActive={isActive}
              isMatch={isMatch}
              onSegmentClick={onSegmentClick}
            />
          );
        })}
      </>
    );
  },
  (prev, next) => {
    // 1. Check stability of big objects
    if (prev.segments !== next.segments) return false;
    if (prev.matchingSegmentIds !== next.matchingSegmentIds) return false;
    if (prev.onSegmentClick !== next.onSegmentClick) return false;
    if (prev.activeSegmentRef !== next.activeSegmentRef) return false;

    // 2. Check indexes (should be stable for same chunk)
    if (prev.startIndex !== next.startIndex) return false;
    if (prev.endIndex !== next.endIndex) return false;

    // 3. Smart check for activeSegmentIndex
    // If the active index changed, we only need to re-render if:
    // a) The NEW active index is inside this chunk
    // b) The OLD active index WAS inside this chunk

    const prevWasInChunk = prev.activeSegmentIndex >= prev.startIndex && prev.activeSegmentIndex < prev.endIndex;
    const nextIsInChunk = next.activeSegmentIndex >= next.startIndex && next.activeSegmentIndex < next.endIndex;

    // If neither old nor new index involves this chunk, we can skip re-render!
    if (!prevWasInChunk && !nextIsInChunk) {
      return true;
    }

    // If it involves this chunk, we must check if the index actually changed
    return prev.activeSegmentIndex === next.activeSegmentIndex;
  }
);

TranscriptChunk.displayName = 'TranscriptChunk';
