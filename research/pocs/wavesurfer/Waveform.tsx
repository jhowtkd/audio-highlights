import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface WaveformProps {
  audioUrl: string;
  onReady?: () => void;
  onRegionCreated?: (region: any) => void;
}

export function Waveform({ audioUrl, onReady, onRegionCreated }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Memory tip: Use MediaElement backend to avoid full AudioContext decode
    // which causes OOM (Out of Memory) crashes on large files.
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4f46e5',
      progressColor: '#312e81',
      backend: 'MediaElement',
      height: 100,
      normalize: true,
      minPxPerSec: 50, // base zoom
    });

    const regionsPlugin = ws.registerPlugin(RegionsPlugin.create());

    regionsPlugin.on('region-created', (region) => {
      onRegionCreated?.(region);
    });

    ws.load(audioUrl);

    ws.on('ready', () => {
      onReady?.();
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [audioUrl]);

  useEffect(() => {
    if (wavesurferRef.current) {
      // Apply zoom based on slider
      wavesurferRef.current.zoom(zoomLevel * 50);
    }
  }, [zoomLevel]);

  const handlePlayPause = () => {
    wavesurferRef.current?.playPause();
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Waveform Proof of Concept</h3>
        <button
          onClick={handlePlayPause}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>

      {/* Waveform Container */}
      <div
        ref={containerRef}
        className="w-full h-[100px] border border-gray-200 rounded overflow-hidden"
      />

      {/* Zoom Controls */}
      <div className="flex items-center gap-4 mt-4">
        <label htmlFor="zoom" className="text-sm font-medium">Zoom:</label>
        <input
          id="zoom"
          type="range"
          min="1"
          max="100"
          value={zoomLevel}
          onChange={(e) => setZoomLevel(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-sm text-gray-500">{zoomLevel}x</span>
      </div>

      <p className="text-sm text-gray-500 mt-2">
        <strong>POC Features:</strong> Uses <code>MediaElement</code> backend to stream audio without OOM crashes, integrates <code>RegionsPlugin</code>, and supports continuous zooming.
      </p>
    </div>
  );
}
