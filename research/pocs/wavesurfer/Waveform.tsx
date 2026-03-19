'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/format-utils';
import type { GeneratedHighlight } from '@/types';

interface WaveformProps {
    audioUrl: string;
    duration: number;
    currentTime: number;
    highlights?: GeneratedHighlight[];
    onSeek?: (time: number) => void;
    className?: string;
}

// Colors for highlights
const HIGHLIGHT_COLORS = [
    'rgba(59, 130, 246, 0.3)',   // blue
    'rgba(139, 92, 246, 0.3)',   // purple
    'rgba(236, 72, 153, 0.3)',   // pink
    'rgba(34, 197, 94, 0.3)',    // green
    'rgba(249, 115, 22, 0.3)',   // orange
];

const DEFAULT_HIGHLIGHTS: GeneratedHighlight[] = [];

export function Waveform({
    audioUrl,
    duration,
    currentTime,
    highlights = DEFAULT_HIGHLIGHTS,
    onSeek,
    className,
}: WaveformProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsPluginRef = useRef<RegionsPlugin | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [zoom, setZoom] = useState(10); // 10px per second

    useEffect(() => {
        if (!containerRef.current || !audioUrl) return;

        // Initialize wavesurfer with RegionsPlugin
        const regionsPlugin = RegionsPlugin.create();
        regionsPluginRef.current = regionsPlugin;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#cbd5e1', // slate-300
            progressColor: '#3b82f6', // blue-500
            cursorColor: '#ef4444', // red-500
            height: 64, // 16 * 4px = 64px roughly matches h-16
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            url: audioUrl,
            plugins: [regionsPlugin],
            // Optimization for long files: use MediaElement to avoid decoding entire file into memory
            mediaControls: true,
            backend: 'MediaElement',
        });

        wavesurferRef.current = ws;

        ws.on('ready', () => {
            setIsLoading(false);

            // Add initial highlights
            highlights.forEach((h, index) => {
                regionsPlugin.addRegion({
                    start: h.startTime,
                    end: h.endTime,
                    content: h.title,
                    color: HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length],
                    drag: false, // For POC, keep static like current implementation
                    resize: false
                });
            });
        });

        // Sync with external currentTime prop
        ws.on('interaction', () => {
             if (onSeek) {
                 onSeek(ws.getCurrentTime());
             }
        });

        // Sync external seek (from audio player)
        // To avoid infinite loops, only sync if the difference is significant
        if (ws.getCurrentTime() !== currentTime) {
            // ws.setTime(currentTime); // We'd need to handle this carefully in a real integration to not conflict with the player
        }

        return () => {
            ws.destroy();
        };
    }, [audioUrl, onSeek]); // Re-initialize only if URL changes

    // Update regions when highlights change
    useEffect(() => {
        if (!regionsPluginRef.current || !wavesurferRef.current) return;

        regionsPluginRef.current.clearRegions();

        highlights.forEach((h, index) => {
            regionsPluginRef.current!.addRegion({
                start: h.startTime,
                end: h.endTime,
                content: h.title,
                color: HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length],
                drag: false,
                resize: false
            });
        });
    }, [highlights]);

    // Handle zoom
    useEffect(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.zoom(zoom);
        }
    }, [zoom]);

    const highlightMarkers = useMemo(() => {
        return highlights.map((h, i) => ({
            highlight: h,
            color: HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length].replace('0.3', '0.8'),
        }));
    }, [highlights]);

    return (
        <div className={cn('space-y-4', className)}>
            {/* Waveform Container */}
            <div className="relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-slate-100/80 dark:bg-slate-800/80 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <span className="text-xs text-slate-500">Gerando waveform...</span>
                    </div>
                )}
                <div
                    ref={containerRef}
                    className="h-16 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden"
                    tabIndex={0}
                    role="slider"
                    aria-label="Audio waveform"
                    aria-valuemin={0}
                    aria-valuemax={duration}
                    aria-valuenow={currentTime}
                    aria-valuetext={formatDuration(currentTime)}
                />
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
                 <span className="text-xs text-slate-500">Zoom:</span>
                 <input
                    type="range"
                    min="1"
                    max="100"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-32"
                />
            </div>

            {/* Highlight Legend */}
            {highlightMarkers.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                    {highlightMarkers.slice(0, 5).map((marker, i) => (
                        <div
                            key={marker.highlight.id}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800"
                        >
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: marker.color }}
                            />
                            <span className="text-slate-600 dark:text-slate-400 truncate max-w-[100px]">
                                #{i + 1}
                            </span>
                        </div>
                    ))}
                    {highlightMarkers.length > 5 && (
                        <span className="text-slate-500">+{highlightMarkers.length - 5} mais</span>
                    )}
                </div>
            )}
        </div>
    );
}
