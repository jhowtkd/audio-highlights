import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

export interface GeneratedHighlight {
    id: string;
    startTime: number;
    endTime: number;
    title: string;
    description: string;
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
    'rgba(59, 130, 246, 0.3)', // blue
    'rgba(16, 185, 129, 0.3)', // emerald
    'rgba(245, 158, 11, 0.3)', // amber
    'rgba(236, 72, 153, 0.3)', // pink
    'rgba(139, 92, 246, 0.3)', // purple
];

export function Waveform({
    audioUrl,
    duration,
    currentTime,
    highlights = [],
    onSeek,
    className
}: WaveformProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsPluginRef = useRef<RegionsPlugin | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [zoom, setZoom] = useState(1);

    // Initialize wavesurfer
    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize regions plugin
        const wsRegions = RegionsPlugin.create();
        regionsPluginRef.current = wsRegions;

        // Initialize wavesurfer
        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#cbd5e1', // slate-300
            progressColor: '#3b82f6', // blue-500
            cursorColor: '#ef4444', // red-500
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 64, // equivalent to h-16
            normalize: true, // normalize peaks
            minPxPerSec: 50, // allows zooming
            plugins: [wsRegions]
        });

        wavesurferRef.current = wavesurfer;

        wavesurfer.on('ready', () => {
            setIsLoading(false);
            wavesurfer.zoom(zoom * 50); // apply initial zoom
        });

        wavesurfer.on('seek', (progress) => {
            if (onSeek) {
                // progress is between 0 and 1
                onSeek(progress * wavesurfer.getDuration());
            }
        });

        wavesurfer.load(audioUrl);

        return () => {
            wavesurfer.destroy();
        };
    }, [audioUrl]);

    // Handle playhead update when currentTime prop changes
    useEffect(() => {
        const wavesurfer = wavesurferRef.current;
        if (!wavesurfer || isLoading || duration === 0) return;

        // Don't update if playing (wavesurfer has its own play loop),
        // but since we are controlling it from outside, we just set seekTo.
        // Prevent infinite loop by checking if we are already close enough.
        const wsTime = wavesurfer.getCurrentTime();
        if (Math.abs(wsTime - currentTime) > 0.1) {
            wavesurfer.seekTo(currentTime / duration);
        }
    }, [currentTime, duration, isLoading]);

    // Handle highlights/regions
    useEffect(() => {
        const wsRegions = regionsPluginRef.current;
        if (!wsRegions || isLoading) return;

        wsRegions.clearRegions();

        highlights.forEach((highlight, index) => {
            wsRegions.addRegion({
                start: highlight.startTime,
                end: highlight.endTime,
                content: highlight.title,
                color: HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length],
                drag: false,
                resize: false
            });
        });
    }, [highlights, isLoading]);

    // Handle Zoom
    const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = Number(e.target.value);
        setZoom(newZoom);
        if (wavesurferRef.current) {
            wavesurferRef.current.zoom(newZoom * 50);
        }
    };

    return (
        <div className={`space-y-4 ${className || ''}`}>
            {isLoading && (
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center">
                    <span className="text-xs text-slate-500">Loading waveform...</span>
                </div>
            )}

            <div
                ref={containerRef}
                className={`relative h-16 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer overflow-hidden ${isLoading ? 'hidden' : 'block'}`}
            />

            {!isLoading && (
                <div className="flex items-center gap-2 px-2">
                    <span className="text-xs text-slate-500">Zoom</span>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={zoom}
                        onChange={handleZoom}
                        className="w-32"
                    />
                </div>
            )}
        </div>
    );
}
