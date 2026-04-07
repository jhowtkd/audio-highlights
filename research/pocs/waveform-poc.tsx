'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';

// For this POC, we'll assume wavesurfer.js is installed.
// In a real implementation, we would `import WaveSurfer from 'wavesurfer.js'`
// and `import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js'`

// Mock types for the POC based on existing application types
interface GeneratedHighlight {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
}

const HIGHLIGHT_COLORS = [
    'rgba(239, 68, 68, 0.3)',   // red-500
    'rgba(249, 115, 22, 0.3)',  // orange-500
    'rgba(234, 179, 8, 0.3)',   // yellow-500
    'rgba(34, 197, 94, 0.3)',   // green-500
    'rgba(59, 130, 246, 0.3)',  // blue-500
    'rgba(168, 85, 247, 0.3)',  // purple-500
    'rgba(236, 72, 153, 0.3)'   // pink-500
];

interface WaveformPOCProps {
  audioUrl: string;
  highlights?: GeneratedHighlight[];
  onSeek?: (time: number) => void;
  onRegionUpdate?: (id: string, start: number, end: number) => void;
}

/**
 * Proof of Concept: Advanced Waveform Navigation using Wavesurfer.js
 *
 * Key improvements over current custom canvas:
 * 1. Uses MediaElement backend (streaming) instead of WebAudio decode to prevent OOM on large podcasts.
 * 2. Supports native zoom via mouse wheel or dedicated UI controls.
 * 3. Uses RegionsPlugin to render highlights as interactive (draggable/resizable) overlays.
 */
export default function WaveformPOC({
  audioUrl,
  highlights = [],
  onSeek,
  onRegionUpdate
}: WaveformPOCProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wavesurferRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const regionsPluginRef = useRef<any>(null);

  const [isReady, setIsReady] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(10);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    // In a real implementation:
    // import WaveSurfer from 'wavesurfer.js';
    // import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

    // Simulate dynamic import for POC purposes
    const initWaveSurfer = async () => {
      try {
        // Mock implementation for the POC to compile without throwing errors
        // In real life this would be: const WS = (await import('wavesurfer.js')).default;
        const MockWaveSurfer = {
            create: (options: any) => ({
                on: (event: string, cb: any) => {
                    if (event === 'ready') setTimeout(cb, 100);
                    if (event === 'interaction') setTimeout(() => cb(10), 200);
                },
                zoom: (level: number) => console.log('Zoomed to', level),
                destroy: () => console.log('Destroyed WS'),
                registerPlugin: (p: any) => p,
            })
        };

        const MockRegionsPlugin = {
            create: () => ({
                addRegion: (r: any) => console.log('Added region', r),
                on: (event: string, cb: any) => {
                    if(event === 'region-updated') {
                        // simulate an update
                    }
                }
            })
        };

        // 1. Initialize Regions Plugin
        const wsRegions = MockRegionsPlugin.create();
        regionsPluginRef.current = wsRegions;

        // 2. Initialize Wavesurfer with the external media element
        const ws = MockWaveSurfer.create({
          container: containerRef.current,
          waveColor: 'rgb(203, 213, 225)', // slate-300
          progressColor: 'rgb(59, 130, 246)', // blue-500
          cursorColor: 'rgb(239, 68, 68)', // red-500
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 64, // 16 rem
          normalize: true,

          // CRITICAL: Use the existing audio element to stream data
          // This prevents the browser from downloading and decoding the entire
          // file into memory (which causes OOM crashes on long files).
          media: audioRef.current || undefined,

          // Optional: Fetch pre-computed peaks from the server if available
          // peaks: [/* array of peaks */],

          plugins: [wsRegions],
        });

        wavesurferRef.current = ws;

        ws.on('ready', () => {
          setIsReady(true);

          // Render initial highlights
          highlights.forEach((h, index) => {
            wsRegions.addRegion({
              id: h.id,
              start: h.startTime,
              end: h.endTime,
              content: h.title,
              color: HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length],
              drag: true, // Allow user to adjust highlight bounds!
              resize: true,
            });
          });
        });

        ws.on('interaction', (newTime: number) => {
            if (onSeek) onSeek(newTime);
        });

        wsRegions.on('region-updated', (region: any) => {
           if (onRegionUpdate) onRegionUpdate(region.id, region.start, region.end);
        });

      } catch (e) {
        console.error('Failed to initialize wavesurfer', e);
      }
    };

    initWaveSurfer();

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]); // Only re-init if the URL changes

  // Handle Zoom
  useEffect(() => {
      if (wavesurferRef.current && isReady) {
          wavesurferRef.current.zoom(zoomLevel);
      }
  }, [zoomLevel, isReady]);

  return (
    <div className="space-y-4">
        {/* The hidden audio element that Wavesurfer will use for streaming playback */}
        <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />

        <div className="flex justify-between items-center text-sm">
            <span>Advanced Waveform POC</span>
            <div className="flex items-center gap-2">
                <label>Zoom:</label>
                <input
                    type="range"
                    min="1"
                    max="100"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(Number(e.target.value))}
                />
            </div>
        </div>

        <div
            ref={containerRef}
            className={`w-full h-16 bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden ${!isReady ? 'animate-pulse' : ''}`}
        >
            {!isReady && <div className="h-full flex items-center justify-center text-xs text-slate-500">Loading waveform...</div>}
        </div>

        <p className="text-xs text-slate-500 italic">
            This POC demonstrates the initialization pattern for wavesurfer.js using the `media` property to stream audio and prevent memory crashes, while enabling `RegionsPlugin` for interactive highlight editing.
        </p>
    </div>
  );
}
