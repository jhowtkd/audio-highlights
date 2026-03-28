'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import type { GeneratedHighlight } from '@/types';

interface WaveformProps {
    audioUrl: string;
    highlights?: GeneratedHighlight[];
    onSeek?: (time: number) => void;
}

const HIGHLIGHT_COLORS = [
    'rgba(59, 130, 246, 0.3)',   // blue
    'rgba(139, 92, 246, 0.3)',   // purple
    'rgba(236, 72, 153, 0.3)',   // pink
    'rgba(34, 197, 94, 0.3)',    // green
    'rgba(249, 115, 22, 0.3)',   // orange
];

export default function WaveformPOC({ audioUrl, highlights = [], onSeek }: WaveformProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mediaRef = useRef<HTMLAudioElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsPluginRef = useRef<RegionsPlugin | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!containerRef.current || !mediaRef.current) return;

        // Initialize regions plugin
        regionsPluginRef.current = RegionsPlugin.create();

        // Initialize WaveSurfer with media element
        const ws = WaveSurfer.create({
            container: containerRef.current,
            media: mediaRef.current, // Critical: streams audio directly from the element without full decoding
            waveColor: '#cbd5e1',
            progressColor: '#3b82f6',
            cursorColor: '#ef4444',
            cursorWidth: 2,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 64,
            plugins: [regionsPluginRef.current],
            normalize: true,
            minPxPerSec: 50, // Base zoom level
        });

        wavesurferRef.current = ws;

        ws.on('ready', () => {
            setIsReady(true);

            // Add regions when ready
            highlights.forEach((highlight, index) => {
                regionsPluginRef.current?.addRegion({
                    start: highlight.startTime,
                    end: highlight.endTime,
                    color: HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length],
                    drag: false,
                    resize: false,
                });
            });
        });

        ws.on('interaction', (time) => {
            onSeek?.(time);
        });

        return () => {
            ws.destroy();
        };
    }, [audioUrl, highlights, onSeek]);

    return (
        <div className="space-y-4">
            {!isReady && (
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center">
                    <span className="text-xs text-slate-500">Loading waveform (Streaming media)...</span>
                </div>
            )}

            {/* Hidden media element */}
            <audio ref={mediaRef} src={audioUrl} style={{ display: 'none' }} />

            {/* Waveform container */}
            <div
                ref={containerRef}
                className={`relative w-full rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 ${!isReady ? 'hidden' : 'block'}`}
            />

            {/* Zoom Controls */}
            {isReady && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Zoom:</span>
                    <input
                        type="range"
                        min="10"
                        max="1000"
                        defaultValue="50"
                        onChange={(e) => {
                            wavesurferRef.current?.zoom(Number(e.target.value));
                        }}
                        className="w-32"
                    />
                </div>
            )}
        </div>
    );
}
