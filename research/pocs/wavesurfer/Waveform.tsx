'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
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

export default function Waveform({
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
    const [hoveredHighlight, setHoveredHighlight] = useState<GeneratedHighlight | null>(null);

    // Initialize WaveSurfer
    useEffect(() => {
        if (!containerRef.current || !audioUrl) return;

        setIsLoading(true);

        const regions = RegionsPlugin.create();
        regionsPluginRef.current = regions;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#cbd5e1', // slate-300
            progressColor: '#3b82f6', // blue-500
            cursorColor: '#ef4444', // red-500
            cursorWidth: 2,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 64, // h-16 = 4rem = 64px
            backend: 'MediaElement', // CRITICAL: prevents OOM crashes for long audio files
            url: audioUrl,
            plugins: [regions],
        });

        wavesurferRef.current = ws;

        ws.on('ready', () => {
            setIsLoading(false);

            // Add regions after wavesurfer is ready
            highlights.forEach((highlight, index) => {
                regions.addRegion({
                    start: highlight.startTime,
                    end: highlight.endTime,
                    color: HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length],
                    drag: false,
                    resize: false,
                    id: highlight.id,
                });
            });
        });

        ws.on('interaction', (newTime) => {
             if (onSeek) {
                 onSeek(newTime);
             }
        });

        ws.on('error', (err) => {
            console.error('WaveSurfer error:', err);
            setIsLoading(false);
        });

        return () => {
            ws.destroy();
        };
    }, [audioUrl, highlights, onSeek]);

    // Sync currentTime prop with WaveSurfer instance
    useEffect(() => {
        const ws = wavesurferRef.current;
        if (!ws) return;

        // Prevent continuous seeking feedback loops if we are already close enough
        if (Math.abs(ws.getCurrentTime() - currentTime) > 0.1) {
            ws.setTime(currentTime);
        }
    }, [currentTime]);

    // Ensure highlights are sorted by startTime for binary search
    const sortedHighlights = useMemo(() => {
        return [...highlights].sort((a, b) => a.startTime - b.startTime);
    }, [highlights]);

    // Handle mouse move to show highlight tooltip
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || duration === 0 || sortedHighlights.length === 0) {
            setHoveredHighlight(null);
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const hoverTime = (x / rect.width) * duration;

        // Binary search for the hovered highlight
        let found: GeneratedHighlight | null = null;
        let left = 0;
        let right = sortedHighlights.length - 1;

        while (left <= right) {
            const mid = (left + right) >> 1;
            const h = sortedHighlights[mid];

            if (hoverTime >= h.startTime && hoverTime <= h.endTime) {
                found = h;
                break;
            }

            if (hoverTime < h.startTime) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        setHoveredHighlight(found);
    }, [duration, sortedHighlights]);

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

    // Highlight markers for legend
    const highlightMarkers = useMemo(() => {
        return highlights.map((h, i) => ({
            highlight: h,
            color: HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length].replace('0.3', '0.8'),
            percentage: {
                start: (h.startTime / duration) * 100,
                end: (h.endTime / duration) * 100,
            }
        }));
    }, [highlights, duration]);

    return (
        <div className={cn('space-y-2', className)}>
            {/* Waveform Container */}
            <div className="relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center z-10">
                        <span className="text-xs text-slate-500">Carregando waveform...</span>
                    </div>
                )}

                <div
                    ref={containerRef}
                    className="relative h-16 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onKeyDown={handleKeyDown}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredHighlight(null)}
                    tabIndex={0}
                    role="slider"
                    aria-label="Audio waveform"
                    aria-valuemin={0}
                    aria-valuemax={duration}
                    aria-valuenow={currentTime}
                    aria-valuetext={formatDuration(currentTime)}
                />

                {/* Tooltip */}
                {hoveredHighlight && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                        {hoveredHighlight.title}
                    </div>
                )}
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
