'use client';

import { memo, type RefObject } from 'react';
import type { TranscriptionSegment } from '@/types';
import { TranscriptSegment } from './transcript-segment';

interface TranscriptChunkProps {
  segments: TranscriptionSegment[];
  startIndex: number;
  activeSegmentIndex: number;
  activeSegmentRef: RefObject<HTMLDivElement | null>;
  matchingSegmentIds: Set<string>;
  onSegmentClick: (startTime: number) => void;
}

export const TranscriptChunk = memo(
  function TranscriptChunk({
    segments,
    startIndex,
    activeSegmentIndex,
    activeSegmentRef,
    matchingSegmentIds,
    onSegmentClick,
  }: TranscriptChunkProps) {
    return (
      <>
        {segments.map((segment, index) => {
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
  (prevProps, nextProps) => {
    // Check stable props
    if (
      prevProps.segments !== nextProps.segments ||
      prevProps.matchingSegmentIds !== nextProps.matchingSegmentIds ||
      prevProps.onSegmentClick !== nextProps.onSegmentClick ||
      prevProps.activeSegmentRef !== nextProps.activeSegmentRef ||
      prevProps.startIndex !== nextProps.startIndex
    ) {
      return false;
    }

    // Check activeSegmentIndex optimization
    const wasActiveInChunk =
      prevProps.activeSegmentIndex >= prevProps.startIndex &&
      prevProps.activeSegmentIndex < prevProps.startIndex + prevProps.segments.length;

    const willBeActiveInChunk =
      nextProps.activeSegmentIndex >= nextProps.startIndex &&
      nextProps.activeSegmentIndex < nextProps.startIndex + nextProps.segments.length;

    // If it wasn't active and won't be active, we don't need to re-render
    if (!wasActiveInChunk && !willBeActiveInChunk) {
      return true;
    }

    // If it was active or will be active, we must re-render to update the isActive prop on children
    // Note: If it was active and stays active (moved within chunk), we re-render.
    // If it was active and moved out, we re-render (to clear isActive).
    // If it was outside and moved in, we re-render (to set isActive).

    return false;
  }
);
