'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface Highlight {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
}

interface WaveSurferPOCProps {
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

export default function WaveSurferPOC({ audioUrl, highlights = [] }: WaveSurferPOCProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<RegionsPlugin | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !audioRef.current) return;

    // Initialize Regions Plugin
    const wsRegions = RegionsPlugin.create();
    regionsPluginRef.current = wsRegions;

    // Initialize WaveSurfer
    // Using the `media` option streams the file natively to prevent browser OOM crashes
    // instead of fully decoding PCM using AudioBuffer
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      media: audioRef.current,
      waveColor: '#cbd5e1', // slate-300
      progressColor: '#3b82f6', // blue-500
      cursorColor: '#ef4444', // red-500
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 64, // Same as the h-16 in original component
      plugins: [wsRegions],
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.on('ready', () => {
      // Add highlights as regions
      highlights.forEach((highlight, index) => {
        wsRegions.addRegion({
          start: highlight.startTime,
          end: highlight.endTime,
          content: highlight.title,
          color: HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length],
          drag: false,
          resize: false,
          id: highlight.id,
        });
      });
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));

    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl, highlights]);

  const handlePlayPause = () => {
    wavesurferRef.current?.playPause();
  };

  return (
    <div className="space-y-4">
      {/* External media element for wavesurfer streaming */}
      <audio ref={audioRef} src={audioUrl} />

      <div className="flex items-center space-x-2 mb-2">
        <button
          onClick={handlePlayPause}
          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <span className="text-sm text-slate-500">
          Streams using HTMLMediaElement to avoid OOM for large audio files.
        </span>
      </div>

      <div
        ref={containerRef}
        className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden cursor-pointer"
      />
    </div>
  );
}
