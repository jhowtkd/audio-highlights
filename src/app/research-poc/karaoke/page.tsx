'use client';

import { useState, useEffect, useRef } from 'react';
import { KaraokeTranscriptPOC } from '@/components/transcription/karaoke-transcript-poc';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatTime } from '@/lib/format-utils';
import type { TranscriptionSegment } from '@/types';

// Dummy Data
const DUMMY_SEGMENT: TranscriptionSegment = {
  id: 'poc-segment-1',
  start: 0,
  end: 8.5,
  text: "Welcome to the future of podcast editing. This is a demonstration of the new interactive karaoke mode.",
  words: [
    { word: "Welcome", start: 0.0, end: 0.5 },
    { word: "to", start: 0.5, end: 0.7 },
    { word: "the", start: 0.7, end: 0.9 },
    { word: "future", start: 0.9, end: 1.5 },
    { word: "of", start: 1.5, end: 1.7 },
    { word: "podcast", start: 1.7, end: 2.3 },
    { word: "editing.", start: 2.3, end: 3.0 },
    { word: "This", start: 3.5, end: 3.8 },
    { word: "is", start: 3.8, end: 4.0 },
    { word: "a", start: 4.0, end: 4.2 },
    { word: "demonstration", start: 4.2, end: 5.2 },
    { word: "of", start: 5.2, end: 5.4 },
    { word: "the", start: 5.4, end: 5.6 },
    { word: "new", start: 5.6, end: 6.0 },
    { word: "interactive", start: 6.0, end: 7.0 },
    { word: "karaoke", start: 7.0, end: 7.8 },
    { word: "mode.", start: 7.8, end: 8.5 },
  ]
};

export default function KaraokePOCPage() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Playback Logic
  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now() - (currentTime * 1000);
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const nextTime = (now - startTime) / 1000;

        if (nextTime > DUMMY_SEGMENT.end) {
          setIsPlaying(false);
          setCurrentTime(DUMMY_SEGMENT.end);
        } else {
          setCurrentTime(nextTime);
        }
      }, 50); // Update every 50ms for smooth animation
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentTime]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const reset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (val: number[]) => {
    setCurrentTime(val[0]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Karaoke Mode POC
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Interactive word-level highlighting for precise navigation.
          </p>
        </div>

        {/* Player Controls */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center text-sm font-mono text-slate-500">
             <span>{formatTime(currentTime)}</span>
             <span>{formatTime(DUMMY_SEGMENT.end)}</span>
          </div>

          <Slider
            value={[currentTime]}
            max={DUMMY_SEGMENT.end}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />

          <div className="flex justify-center gap-4">
            <Button onClick={togglePlay}>
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button variant="outline" onClick={reset}>
              Reset
            </Button>
          </div>
        </div>

        {/* The Component */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Live Preview</h2>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <KaraokeTranscriptPOC
               segment={DUMMY_SEGMENT}
               isActive={true}
               currentTime={currentTime}
               onSegmentClick={(time) => setCurrentTime(time)}
             />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300">
           <strong>How it works:</strong>
           <ul className="list-disc ml-5 mt-2 space-y-1">
             <li>The backend provides word-level timestamps (<code>words</code> array).</li>
             <li>The component renders individual <code>&lt;span&gt;</code> elements.</li>
             <li>Current word is highlighted based on <code>currentTime</code>.</li>
             <li>Clicking a word updates the player time (simulated here).</li>
           </ul>
        </div>
      </div>
    </div>
  );
}
