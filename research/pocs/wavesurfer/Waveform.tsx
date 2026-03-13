'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface Highlight {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
}

interface WaveformPOCProps {
  audioUrl: string;
  highlights?: Highlight[];
}

const HIGHLIGHT_COLORS = [
  'rgba(59, 130, 246, 0.3)',   // blue
  'rgba(139, 92, 246, 0.3)',   // purple
  'rgba(236, 72, 153, 0.3)',   // pink
  'rgba(34, 197, 94, 0.3)',    // green
  'rgba(249, 115, 22, 0.3)',   // orange
];

export function WaveformPOC({ audioUrl, highlights = [] }: WaveformPOCProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    // Initialize Regions plugin
    const wsRegions = RegionsPlugin.create();
    regionsRef.current = wsRegions;

    // Initialize WaveSurfer
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#cbd5e1', // slate-300
      progressColor: '#3b82f6', // blue-500
      cursorColor: '#ef4444', // red-500
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 64, // match current h-16
      url: audioUrl,
      plugins: [wsRegions],
    });

    wavesurferRef.current = ws;

    ws.on('ready', () => {
      // Add regions once audio is ready
      highlights.forEach((h, i) => {
        wsRegions.addRegion({
          start: h.startTime,
          end: h.endTime,
          color: HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length],
          id: h.id,
          drag: false,
          resize: false,
        });
      });
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    return () => {
      ws.destroy();
    };
  }, [audioUrl, highlights]);

  // Handle Zoom
  useEffect(() => {
    if (wavesurferRef.current) {
        // Base minPxPerSec is usually around 1-10.
        // Multiplying by zoomLevel gives a zooming effect.
        const basePxPerSec = 10;
        wavesurferRef.current.zoom(zoomLevel * basePxPerSec);
    }
  }, [zoomLevel]);

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
      <h3 className="font-semibold text-sm">WaveSurfer.js POC</h3>

      {/* Waveform Container */}
      <div
        ref={containerRef}
        className="w-full relative rounded-lg overflow-hidden border border-slate-200"
      />

      {/* Controls */}
      <div className="flex items-center gap-4 justify-between">
         <button
           onClick={() => wavesurferRef.current?.playPause()}
           className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
         >
            {isPlaying ? 'Pause' : 'Play'}
         </button>

         <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Zoom:</span>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-32"
            />
         </div>
      </div>
    </div>
  );
}
