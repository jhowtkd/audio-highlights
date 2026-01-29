'use client';

import { memo, RefObject } from 'react';
import type { TranscriptionSegment } from '@/types';
import { TranscriptSegment } from './transcript-segment';

interface TranscriptChunkProps {
  segments: TranscriptionSegment[];
  startIndex: number;
  endIndex: number;
  activeSegmentIndex: number;
  matchingSegmentIds: Set<string>;
  onSegmentClick: (startTime: number) => void;
  activeSegmentRef: RefObject<HTMLDivElement | null>;
}

function arePropsEqual(prev: TranscriptChunkProps, next: TranscriptChunkProps) {
  // Reference checks for stable props
  if (prev.segments !== next.segments) return false;
  if (prev.onSegmentClick !== next.onSegmentClick) return false;
  if (prev.matchingSegmentIds !== next.matchingSegmentIds) return false;
  if (prev.startIndex !== next.startIndex) return false;
  if (prev.endIndex !== next.endIndex) return false;
  if (prev.activeSegmentRef !== next.activeSegmentRef) return false;

  // Check if activeSegmentIndex change affects this chunk
  const prevActive = prev.activeSegmentIndex;
  const nextActive = next.activeSegmentIndex;

  if (prevActive === nextActive) return true;

  const start = next.startIndex;
  const end = next.endIndex;

  // Check if active segment was inside this chunk or is now inside this chunk
  const prevInChunk = prevActive >= start && prevActive < end;
  const nextInChunk = nextActive >= start && nextActive < end;

  // If both are outside, no need to re-render
  if (!prevInChunk && !nextInChunk) return true;

  // If it entered, left, or moved within the chunk, we must re-render
  return false;
}

export const TranscriptChunk = memo(({
  segments,
  startIndex,
  endIndex,
  activeSegmentIndex,
  matchingSegmentIds,
  onSegmentClick,
  activeSegmentRef
}: TranscriptChunkProps) => {
  const chunkSegments = [];

  for (let i = startIndex; i < endIndex; i++) {
    if (i >= segments.length) break;
    const segment = segments[i];
    const isActive = i === activeSegmentIndex;
    const isMatch = matchingSegmentIds.has(segment.id);

    chunkSegments.push(
      <TranscriptSegment
        key={segment.id}
        ref={isActive ? activeSegmentRef : null}
        segment={segment}
        isActive={isActive}
        isMatch={isMatch}
        onSegmentClick={onSegmentClick}
      />
    );
  }

  return <>{chunkSegments}</>;
}, arePropsEqual);

TranscriptChunk.displayName = 'TranscriptChunk';
