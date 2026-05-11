import React, { useRef, useEffect, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface WavesurferPOCProps {
  audioUrl?: string; // Optional for POC to allow testing without actual file
}

export const WavesurferPOC: React.FC<WavesurferPOCProps> = ({ audioUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(10);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize WaveSurfer
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(203, 213, 225, 0.8)', // slate-300
      progressColor: 'rgba(59, 130, 246, 0.8)', // blue-500
      cursorColor: 'rgba(239, 68, 68, 1)', // red-500
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 64,
      normalize: true,
      minPxPerSec: zoomLevel,
      plugins: [
        RegionsPlugin.create()
      ],
    });

    wavesurferRef.current = ws;

    // Load mock audio or real audio
    if (audioUrl) {
      ws.load(audioUrl);
    } else {
        // Create a short beep sound using Web Audio API for testing
        const ctx = new window.AudioContext();
        const oscillator = ctx.createOscillator();
        const dest = ctx.createMediaStreamDestination();
        oscillator.connect(dest);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 5000); // 5 sec audio

        // Mock loading
        ws.load('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'); // valid tiny wav file
    }

    const onReady = () => {
      setIsReady(true);

      // Add a mock highlight region
      const regionsPlugin = ws.getActivePlugins().find(p => p instanceof RegionsPlugin) as any;
      if (regionsPlugin) {
          regionsPlugin.addRegion({
            start: 1,
            end: 3,
            color: 'rgba(139, 92, 246, 0.3)', // purple
            drag: false,
            resize: false,
          });
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = (time: number) => setCurrentTime(time);

    ws.on('ready', onReady);
    ws.on('play', onPlay);
    ws.on('pause', onPause);
    ws.on('timeupdate', onTimeUpdate);

    return () => {
      ws.un('ready', onReady);
      ws.un('play', onPlay);
      ws.un('pause', onPause);
      ws.un('timeupdate', onTimeUpdate);
      ws.destroy();
    };
  }, [audioUrl]); // Intentionally not including zoomLevel to prevent full re-render on zoom

  // Handle zoom separately
  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.zoom(zoomLevel);
    }
  }, [zoomLevel, isReady]);

  const togglePlay = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  }, []);

  const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomLevel(Number(e.target.value));
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border rounded-lg shadow-sm font-sans max-w-2xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Wavesurfer.js POC</h3>
        <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
          {currentTime.toFixed(2)}s
        </span>
      </div>

      {/* Waveform Container */}
      <div
        ref={containerRef}
        className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded mb-4 overflow-hidden"
      />

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          disabled={!isReady}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium disabled:opacity-50"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <div className="flex items-center gap-2 flex-1">
          <label htmlFor="zoom" className="text-sm text-slate-600 dark:text-slate-400 font-medium">Zoom:</label>
          <input
            id="zoom"
            type="range"
            min="10"
            max="100"
            value={zoomLevel}
            onChange={handleZoom}
            className="flex-1"
            disabled={!isReady}
          />
        </div>
      </div>
    </div>
  );
};
