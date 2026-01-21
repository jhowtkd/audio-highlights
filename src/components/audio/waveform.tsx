'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
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

export function Waveform({
    audioUrl,
    duration,
    currentTime,
    highlights = [],
    onSeek,
    className,
}: WaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [waveformData, setWaveformData] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredHighlight, setHoveredHighlight] = useState<GeneratedHighlight | null>(null);

    // Generate waveform data from audio
    useEffect(() => {
        if (!audioUrl) return;

        const generateWaveform = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(audioUrl);
                const arrayBuffer = await response.arrayBuffer();

                const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                // Get samples from the audio buffer
                const channelData = audioBuffer.getChannelData(0);
                const samples = 200; // Number of bars in the waveform
                const blockSize = Math.floor(channelData.length / samples);
                const filteredData: number[] = [];

                for (let i = 0; i < samples; i++) {
                    const blockStart = blockSize * i;
                    let sum = 0;

                    for (let j = 0; j < blockSize; j++) {
                        sum += Math.abs(channelData[blockStart + j]);
                    }

                    filteredData.push(sum / blockSize);
                }

                // Normalize the data
                const multiplier = Math.max(...filteredData);
                const normalizedData = filteredData.map(n => n / multiplier);

                setWaveformData(normalizedData);
                audioContext.close();
            } catch (error) {
                console.error('Error generating waveform:', error);
                // Generate fake waveform as fallback
                const fakeData = Array.from({ length: 200 }, () => Math.random() * 0.5 + 0.2);
                setWaveformData(fakeData);
            } finally {
                setIsLoading(false);
            }
        };

        generateWaveform();
    }, [audioUrl]);

    // Cache for waveform layout to avoid recalculating on every frame
    const layoutCache = useRef<{
        width: number;
        height: number;
        data: number[];
        bars: { x: number; y: number; w: number; h: number }[];
    } | null>(null);

    // Draw waveform on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || waveformData.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();

        // Avoid resetting canvas if dimensions haven't changed
        const targetWidth = Math.floor(rect.width * dpr);
        const targetHeight = Math.floor(rect.height * dpr);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            ctx.scale(dpr, dpr);
        }

        const width = rect.width;
        const height = rect.height;
        const barWidth = width / waveformData.length;
        const playedPosition = duration > 0 ? (currentTime / duration) * width : 0;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw highlight regions
        highlights.forEach((highlight, index) => {
            const startX = (highlight.startTime / duration) * width;
            const endX = (highlight.endTime / duration) * width;

            ctx.fillStyle = HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length];
            ctx.fillRect(startX, 0, endX - startX, height);
        });

        // Optimize waveform drawing with caching and batched fillStyle
        // Check if we need to recalculate layout
        if (!layoutCache.current ||
            layoutCache.current.width !== width ||
            layoutCache.current.height !== height ||
            layoutCache.current.data !== waveformData
        ) {
             const bars = waveformData.map((value, index) => {
                 const x = index * barWidth;
                 const barHeight = value * (height * 0.8);
                 const y = (height - barHeight) / 2;
                 return { x, y, w: barWidth - 1, h: barHeight };
             });
             layoutCache.current = { width, height, data: waveformData, bars };
        }

        const bars = layoutCache.current.bars;

        // Draw Blue bars (Played)
        ctx.fillStyle = '#3b82f6'; // blue-500
        let i = 0;
        for (; i < bars.length; i++) {
             // Stop when we reach unplayed section
             if (bars[i].x >= playedPosition) break;
             const b = bars[i];
             ctx.fillRect(b.x, b.y, b.w, b.h);
        }

        // Draw Grey bars (Unplayed)
        ctx.fillStyle = '#cbd5e1'; // slate-300
        for (; i < bars.length; i++) {
             const b = bars[i];
             ctx.fillRect(b.x, b.y, b.w, b.h);
        }

        // Draw playhead
        ctx.fillStyle = '#ef4444'; // red-500
        ctx.fillRect(playedPosition - 1, 0, 2, height);

    }, [waveformData, currentTime, duration, highlights]);

    // Handle click to seek
    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!onSeek || !containerRef.current || duration === 0) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const seekTime = percentage * duration;

        onSeek(Math.max(0, Math.min(seekTime, duration)));
    }, [onSeek, duration]);

    // Handle mouse move to show highlight tooltip
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || duration === 0 || highlights.length === 0) {
            setHoveredHighlight(null);
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const hoverTime = (x / rect.width) * duration;

        const found = highlights.find(
            h => hoverTime >= h.startTime && hoverTime <= h.endTime
        );

        setHoveredHighlight(found || null);
    }, [duration, highlights]);

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

    if (isLoading) {
        return (
            <div className={cn('h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center', className)}>
                <span className="text-xs text-slate-500">Gerando waveform...</span>
            </div>
        );
    }

    return (
        <div className={cn('space-y-2', className)}>
            {/* Waveform Canvas */}
            <div
                ref={containerRef}
                className="relative h-16 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer overflow-hidden"
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredHighlight(null)}
            >
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Tooltip */}
                {hoveredHighlight && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap z-10">
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
