'use client';

import { useState, useEffect } from 'react';
import { VirtualizedTranscriptViewerPOC } from '@/components/transcription/virtualized-transcript-viewer-poc';
import { TranscriptionSegment } from '@/types';
import { Button } from '@/components/ui/button';

export default function ResearchPOCPage() {
  const [segments] = useState<TranscriptionSegment[]>(() =>
    Array.from({ length: 10000 }, (_, i) => ({
      id: `seg-${i}`,
      start: i * 2,
      end: i * 2 + 1.8,
      text: `This is segment number ${i} of the transcript. It acts as a placeholder for testing virtualization performance.`,
    }))
  );

  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Simulate playback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveSegmentIndex((prev) => (prev + 1) % segments.length);
      }, 100); // Fast playback to test scrolling
    }
    return () => clearInterval(interval);
  }, [isPlaying, segments.length]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Research POC: Virtualized Transcript Viewer</h1>
        <p className="text-slate-600">Rendering {segments.length.toLocaleString()} segments with virtualization.</p>

        <div className="flex gap-2 items-center">
            <Button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? 'Pause' : 'Play (Simulate)'}
            </Button>
            <span>Active Segment: {activeSegmentIndex}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 h-[600px]">
            <VirtualizedTranscriptViewerPOC
                segments={segments}
                activeSegmentIndex={activeSegmentIndex}
                onSegmentClick={(time) => console.log('Clicked time:', time)}
                className="h-full"
            />
        </div>
      </div>
    </div>
  );
}
