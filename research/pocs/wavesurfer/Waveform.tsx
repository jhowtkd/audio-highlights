import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

export const WaveformPOC: React.FC<{ url: string }> = ({ url }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(50);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create a Regions plugin instance
    const wsRegions = RegionsPlugin.create();

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(139, 92, 246, 0.5)', // violet-500 with opacity
      progressColor: 'rgb(139, 92, 246)', // violet-500
      cursorColor: 'rgb(76, 29, 149)', // violet-900
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      plugins: [wsRegions]
    });

    wavesurferRef.current = ws;

    ws.on('ready', () => {
      wsRegions.addRegion({
        start: 1,
        end: 5,
        content: 'Highlight 1',
        color: 'rgba(234, 179, 8, 0.3)', // yellow-500 with opacity
      });
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    ws.load(url);

    return () => {
      ws.destroy();
    };
  }, [url]);

  const onPlayPause = () => {
    wavesurferRef.current?.playPause();
  };

  const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = Number(e.target.value);
    setZoom(newZoom);
    wavesurferRef.current?.zoom(newZoom);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">WaveSurfer.js POC</h3>
        <button
          onClick={onPlayPause}
          className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>

      <div ref={containerRef} className="w-full h-32 bg-slate-50 rounded" />

      <div className="flex items-center gap-4">
        <label htmlFor="zoom" className="text-sm font-medium">Zoom:</label>
        <input
          id="zoom"
          type="range"
          min="10"
          max="1000"
          value={zoom}
          onChange={handleZoom}
          className="flex-1"
        />
      </div>
    </div>
  );
};
