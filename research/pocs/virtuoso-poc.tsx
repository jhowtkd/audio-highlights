'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

interface Segment {
  id: string;
  start: number;
  end: number;
  text: string;
}

// Generate 1000 segments
const generateSegments = (count: number): Segment[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `seg-${i}`,
    start: i * 5,
    end: (i + 1) * 5,
    text: `Segment ${i + 1}: This is a simulated transcript segment. It has some variable length text to test the virtualization capability of the list. ${
      i % 3 === 0 ? 'Here is some extra text to make this one longer. '.repeat(5) : ''
    }`,
  }));
};

export const VirtuosoPOC = () => {
  const [segments] = useState(() => generateSegments(1000));
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Determine active segment
  const activeIndex = useMemo(() => {
    return segments.findIndex(s => currentTime >= s.start && currentTime < s.end);
  }, [currentTime, segments]);

  // Simulate playback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
           if (prev >= segments[segments.length - 1].end) {
             setIsPlaying(false);
             return prev;
           }
           return prev + 0.1; // 100ms increment
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, segments]);

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeIndex !== -1 && virtuosoRef.current) {
      virtuosoRef.current.scrollIntoView({
        index: activeIndex,
        behavior: 'smooth',
        align: 'center',
      });
    }
  }, [activeIndex]);

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto border rounded-lg shadow-lg bg-white dark:bg-slate-900">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800">
        <h2 className="font-bold text-lg">Virtualized Transcript POC</h2>
        <div className="space-x-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <span className="font-mono text-sm">{currentTime.toFixed(1)}s</span>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-950 p-4">
        <Virtuoso
          ref={virtuosoRef}
          style={{ height: '100%' }}
          data={segments}
          itemContent={(index, segment) => (
            <div
              className={`p-3 mb-2 rounded transition-colors duration-200 ${
                index === activeIndex
                  ? 'bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-500'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
              }`}
            >
              <div className="flex gap-4">
                <span className="text-xs font-mono text-slate-500 w-16 shrink-0 mt-1">
                  {segment.start.toFixed(1)}s
                </span>
                <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                  {segment.text}
                </p>
              </div>
            </div>
          )}
        />
      </div>

      <div className="p-2 border-t text-xs text-center text-slate-500">
        Rendering {segments.length} items with virtualization. Check DOM node count.
      </div>
    </div>
  );
};
