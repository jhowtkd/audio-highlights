import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

// Mock types for the PoC
interface GeneratedHighlight {
    id: string;
    startTime: number;
    endTime: number;
    title: string;
}

interface WaveformProps {
    audioUrl: string;
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

export function Waveform({ audioUrl, highlights = [], onSeek, className }: WaveformProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsRef = useRef<RegionsPlugin | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [zoom, setZoom] = useState(1);

    // Initialize WaveSurfer
    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize Regions plugin
        const wsRegions = RegionsPlugin.create();
        regionsRef.current = wsRegions;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#cbd5e1', // slate-300
            progressColor: '#3b82f6', // blue-500
            cursorColor: '#ef4444', // red-500
            cursorWidth: 2,
            height: 64, // 16 * 4 (h-16 equivalent)
            normalize: true,
            minPxPerSec: 50,
            plugins: [wsRegions],
        });

        wavesurferRef.current = ws;

        // Load audio
        ws.load(audioUrl);

        ws.on('ready', () => {
            setIsReady(true);
        });

        ws.on('interaction', () => {
            if (onSeek) {
                onSeek(ws.getCurrentTime());
            }
        });

        return () => {
            ws.destroy();
        };
    }, [audioUrl, onSeek]);

    // Handle highlights (Regions)
    useEffect(() => {
        if (!isReady || !regionsRef.current) return;

        const wsRegions = regionsRef.current;
        wsRegions.clearRegions();

        highlights.forEach((highlight, index) => {
            wsRegions.addRegion({
                start: highlight.startTime,
                end: highlight.endTime,
                content: highlight.title,
                color: HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length],
                drag: false,
                resize: false,
            });
        });
    }, [isReady, highlights]);

    // Handle zoom
    useEffect(() => {
        if (wavesurferRef.current && isReady) {
            wavesurferRef.current.zoom(zoom * 50); // Base 50px per second
        }
    }, [zoom, isReady]);

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.5, 5));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.5, 0.5));

    return (
        <div className={`space-y-2 ${className || ''}`}>
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Audio Waveform (wavesurfer.js)</span>
                <div className="flex gap-2">
                    <button
                        onClick={handleZoomOut}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-xs"
                        disabled={zoom <= 0.5}
                        aria-label="Zoom out"
                    >
                        - Zoom
                    </button>
                    <button
                        onClick={handleZoomIn}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-xs"
                        disabled={zoom >= 5}
                        aria-label="Zoom in"
                    >
                        + Zoom
                    </button>
                </div>
            </div>

            {!isReady && (
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center">
                    <span className="text-xs text-slate-500">Loading waveform...</span>
                </div>
            )}

            <div
                ref={containerRef}
                className={`relative h-16 bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden ${!isReady ? 'hidden' : ''}`}
                tabIndex={0}
                role="slider"
                aria-label="Audio waveform"
            />
        </div>
    );
}
