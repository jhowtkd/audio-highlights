'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import { Play, Pause, ZoomIn, ZoomOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface WaveformPocProps {
  audioUrl: string;
  className?: string;
}

// Minimal interface for Region options to avoid 'any'
interface RegionOptions {
    start: number;
    end: number;
    content?: string;
    color?: string;
    drag?: boolean;
    resize?: boolean;
}

interface RegionsPluginType {
    addRegion: (options: RegionOptions) => void;
}

export function WaveformPoc({ audioUrl, className }: WaveformPocProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPluginType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(10); // pixels per second
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !timelineRef.current) return;

    const regions = RegionsPlugin.create();

    // Store regions plugin reference directly
    regionsRef.current = regions as unknown as RegionsPluginType;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      url: audioUrl,
      waveColor: '#4f46e5', // Indigo 600
      progressColor: '#818cf8', // Indigo 400
      cursorColor: '#ef4444', // Red 500
      height: 128,
      normalize: true,
      minPxPerSec: 10,
      plugins: [
        regions,
        TimelinePlugin.create({
            container: timelineRef.current,
        }),
      ],
    });

    ws.on('ready', () => {
      setIsReady(true);
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    wsRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.playPause();
    }
  }, []);

  const handleZoom = useCallback((value: number[]) => {
    const newZoom = value[0];
    setZoom(newZoom);
    if (wsRef.current && isReady) {
      wsRef.current.zoom(newZoom);
    }
  }, [isReady]);

  const addRegion = useCallback(() => {
    if (wsRef.current && isReady && regionsRef.current) {
      const currentTime = wsRef.current.getCurrentTime();
      regionsRef.current.addRegion({
        start: currentTime,
        end: currentTime + 5,
        content: 'New Highlight',
        color: 'rgba(239, 68, 68, 0.2)', // Red
        drag: true,
        resize: true,
      });
    }
  }, [isReady]);

  return (
    <div className={cn('space-y-4 p-4 border rounded-xl bg-white dark:bg-slate-900', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Advanced Waveform Navigation (POC)</h3>
        <div className="flex items-center gap-2">
           <Button
            size="sm"
            onClick={togglePlay}
            disabled={!isReady}
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={addRegion}
            disabled={!isReady}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Region
          </Button>
        </div>
      </div>

      <div className="relative border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div ref={containerRef} id="waveform" />
        <div ref={timelineRef} id="timeline" />

        {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                <span className="animate-pulse font-medium text-slate-500">Loading Audio...</span>
            </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <ZoomOut className="h-4 w-4 text-slate-500" />
        <Slider
          value={[zoom]}
          min={10}
          max={200}
          step={1}
          onValueChange={handleZoom}
          className="flex-1"
          aria-label="Zoom Level"
        />
        <ZoomIn className="h-4 w-4 text-slate-500" />
        <span className="text-xs text-slate-500 w-12 text-right">{zoom}px/s</span>
      </div>

      <div className="text-xs text-slate-500">
        <p>Instructions:</p>
        <ul className="list-disc list-inside">
            <li>Click anywhere to seek.</li>
            <li>Drag regions to move them.</li>
            <li>Resize regions by dragging the edges.</li>
            <li>Use the slider to zoom in/out for precision editing.</li>
        </ul>
      </div>
    </div>
  );
}
