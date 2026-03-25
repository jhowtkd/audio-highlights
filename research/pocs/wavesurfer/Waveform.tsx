'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/format-utils';
import type { GeneratedHighlight } from '@/types';

// Define the Region parameters explicitly based on the expected types
interface RegionParams {
  id: string;
  start: number;
  end: number;
  content: string;
  color: string;
  drag: boolean;
  resize: boolean;
}

interface WaveformProps {
    audioUrl: string;
    duration: number;
    currentTime: number;
    highlights?: GeneratedHighlight[];
    onSeek?: (time: number) => void;
    className?: string;
}

const HIGHLIGHT_COLORS = [
    'rgba(59, 130, 246, 0.3)',   // blue
    'rgba(139, 92, 246, 0.3)',   // purple
    'rgba(236, 72, 153, 0.3)',   // pink
    'rgba(34, 197, 94, 0.3)',    // green
    'rgba(249, 115, 22, 0.3)',   // orange
];

export function Waveform({
    audioUrl,
    duration,
    currentTime,
    highlights = [],
    onSeek,
    className,
}: WaveformProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsRef = useRef<RegionsPlugin | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Initialize WaveSurfer
    useEffect(() => {
        if (!containerRef.current || !audioUrl) return;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#cbd5e1', // slate-300
            progressColor: '#3b82f6', // blue-500
            cursorColor: '#ef4444', // red-500
            height: 64, // 4rem (h-16)
            normalize: true,
            backend: 'MediaElement', // CRITICAL: prevents OOM crashes for long audio files
            minPxPerSec: 50, // allow zooming
            autoCenter: true,
        });

        const regions = ws.registerPlugin(RegionsPlugin.create());

        wavesurferRef.current = ws;
        regionsRef.current = regions;

        ws.on('ready', () => {
            setIsReady(true);

            // Add regions when ready
            highlights.forEach((h, index) => {
                const color = HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length];
                const params: RegionParams = {
                    id: h.id,
                    start: h.startTime,
                    end: h.endTime,
                    content: h.title,
                    color: color,
                    drag: false,
                    resize: false
                };
                regions.addRegion(params);
            });
        });

        ws.on('interaction', () => {
            if (onSeek) {
               onSeek(ws.getCurrentTime());
            }
        });

        ws.load(audioUrl);

        return () => {
            ws.destroy();
        };
    }, [audioUrl, onSeek, highlights]);

    // Update playhead externally
    useEffect(() => {
        const ws = wavesurferRef.current;
        if (ws && isReady && Math.abs(ws.getCurrentTime() - currentTime) > 0.1) {
             ws.setTime(currentTime);
        }
    }, [currentTime, isReady]);

     // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!onSeek || duration === 0) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                onSeek(Math.max(0, currentTime - 5));
                break;
            case 'ArrowRight':
                e.preventDefault();
                onSeek(Math.min(duration, currentTime + 5));
                break;
            case 'Home':
                e.preventDefault();
                onSeek(0);
                break;
            case 'End':
                e.preventDefault();
                onSeek(duration);
                break;
        }
    }, [onSeek, duration, currentTime]);

    return (
        <div className={cn('space-y-2', className)}>
            {!isReady && (
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center absolute w-full top-0 left-0 z-10 pointer-events-none">
                    <span className="text-xs text-slate-500">Carregando waveform...</span>
                </div>
            )}
            <div
                ref={containerRef}
                className="relative h-16 bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                tabIndex={0}
                onKeyDown={handleKeyDown}
                role="slider"
                aria-label="Audio waveform"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={currentTime}
                aria-valuetext={formatDuration(currentTime)}
            />
        </div>
    );
}
