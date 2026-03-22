'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface HighlightRegion {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
}

interface WaveformPOCProps {
  audioUrl: string;
  highlights: HighlightRegion[];
  onRegionClick?: (region: HighlightRegion) => void;
  onReady?: () => void;
  height?: number;
}

export const WaveformPOC: React.FC<WaveformPOCProps> = ({
  audioUrl,
  highlights,
  onRegionClick,
  onReady,
  height = 100
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<RegionsPlugin | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    // Create Regions plugin instance
    const regions = RegionsPlugin.create();
    regionsPluginRef.current = regions;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(156, 163, 175, 0.5)', // tailwind gray-400
      progressColor: 'rgba(59, 130, 246, 0.8)', // tailwind blue-500
      cursorColor: 'rgb(239, 68, 68)', // tailwind red-500
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: height,
      normalize: true,
      // CRITICAL for large files to avoid OOM crashes
      backend: 'MediaElement',
      plugins: [regions]
    });

    wavesurferRef.current = ws;

    // Event listeners
    ws.on('ready', () => {
      setIsReady(true);
      onReady?.();

      // Load audio file into wavesurfer (since MediaElement backend doesn't fetch on its own)
      const media = new Audio(audioUrl);
      ws.setMediaElement(media);
    });

    ws.on('interaction', () => {
       // Optional: auto-play on interaction
       // ws.play();
    });

    // Load URL
    // MediaElement backend requires loading via setMediaElement above, but we still call load
    // so Wavesurfer attempts to draw peaks (or fetches them if provided).
    // For pure MediaElement without pre-computed peaks, it draws a generic waveform
    // or requires a backend peak generation. Here we just load it to demonstrate setup.
    ws.load(audioUrl);

    return () => {
      ws.destroy();
    };
  }, [audioUrl, height, onReady]);

  // Handle Highlights (Regions)
  useEffect(() => {
    if (!isReady || !regionsPluginRef.current) return;

    const regions = regionsPluginRef.current;

    // Clear existing
    regions.clearRegions();

    // Add new regions
    highlights.forEach((h, index) => {
      const colors = [
        'rgba(239, 68, 68, 0.3)',   // red
        'rgba(59, 130, 246, 0.3)',  // blue
        'rgba(16, 185, 129, 0.3)',  // green
        'rgba(245, 158, 11, 0.3)'   // yellow
      ];

      const region = regions.addRegion({
        start: h.startTime,
        end: h.endTime,
        content: h.title,
        color: colors[index % colors.length],
        drag: false, // For POC, keep static. In full feature, enable dragging.
        resize: false,
        id: h.id
      });

      region.on('click', () => {
         onRegionClick?.(h);
         wavesurferRef.current?.seekTo(h.startTime / wavesurferRef.current.getDuration());
      });
    });
  }, [isReady, highlights, onRegionClick]);

  // Handle Zoom
  useEffect(() => {
    if (!isReady || !wavesurferRef.current) return;
    // wavesurfer v7 zoom takes pixels per second.
    // Base is usually around 10-50 for a full view depending on file length.
    // Here we use a multiplier. 1 = auto/fit, > 1 zooms in.
    const duration = wavesurferRef.current.getDuration() || 1;
    const containerWidth = containerRef.current?.clientWidth || 800;
    const minPxPerSec = containerWidth / duration;

    // Minimum zoom fits container, then scale up
    wavesurferRef.current.zoom(minPxPerSec * zoomLevel);
  }, [zoomLevel, isReady]);

  return (
    <div className="flex flex-col gap-4 w-full p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Waveform Viewer (POC)</h3>
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Zoom:</label>
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            className="w-32"
          />
        </div>
      </div>

      {/* Waveform Container */}
      <div
        ref={containerRef}
        className="w-full relative overflow-hidden bg-white dark:bg-slate-800 rounded shadow-inner"
        style={{ height: height }}
      >
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
            Initializing Waveform...
          </div>
        )}
      </div>

      {/* Basic Controls for POC */}
      <div className="flex justify-center gap-2 mt-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          onClick={() => wavesurferRef.current?.playPause()}
          disabled={!isReady}
        >
          Play / Pause
        </button>
      </div>
    </div>
  );
};
