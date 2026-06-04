'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/format-utils';
import type { GeneratedHighlight, TranscriptionSegment } from '@/types';

interface WaveformProps {
    audioUrl: string;
    duration: number;
    currentTime: number;
    highlights?: GeneratedHighlight[];
    segments?: TranscriptionSegment[];
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
const DEFAULT_SEGMENTS: TranscriptionSegment[] = [];

export function Waveform({
    audioUrl,
    duration,
    currentTime,
    highlights = DEFAULT_HIGHLIGHTS,
    segments = DEFAULT_SEGMENTS,
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

            // Optimization: For long files (> 10 mins) with segments available,
            // generate waveform from transcription segments to avoid OOM crash from decodeAudioData.
            if (duration > 600 && segments && segments.length > 0) {
                try {
                    console.log('Using optimized waveform generation from segments...');
                    const samples = 200;
                    const data = new Array(samples).fill(0);
                    const bucketSize = duration / samples;

                    // Calculate speech activity per bucket
                    const maxSamplesIndex = samples - 1;
                    segments.forEach(segment => {
                        const startBucket = Math.floor(segment.start / bucketSize);
                        const endBucket = Math.floor(segment.end / bucketSize);

                        const startIdx = Math.max(0, startBucket);
                        const endIdx = Math.min(maxSamplesIndex, endBucket);

                        for (let i = startIdx; i <= endIdx; i++) {
                            // Add value proportional to overlap, but simple counting works for visualization
                            data[i] += 1;
                        }
                    });

                    // Normalize
                    const max = Math.max(...data, 1);
                    const normalizedData = data.map(v => Math.min(1, (v / max) * 1.5)); // 1.5x gain for visibility

                    setWaveformData(normalizedData);
                    setIsLoading(false);
                    return;
                } catch (e) {
                    console.warn('Optimized generation failed, falling back to full decode', e);
                }
            }

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

                    // Optimization: Subsample the data to prevent blocking the main thread
                    // For an hour-long audio, blockSize can be ~793,800. We don't need every sample.
                    const stepSize = Math.max(1, Math.floor(blockSize / 100));
                    let count = 0;

                    for (let j = 0; j < blockSize; j += stepSize) {
                        sum += Math.abs(channelData[blockStart + j]);
                        count++;
                    }

                    filteredData.push(sum / count);
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
    }, [audioUrl, duration, segments]);

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Monitor container size changes
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(() => {
            const { width, height } = container.getBoundingClientRect();
            setDimensions({ width, height });
        });

        observer.observe(container);

        // Set initial size
        const { width, height } = container.getBoundingClientRect();
        setDimensions({ width, height });

        return () => observer.disconnect();
    }, []);

    // Draw waveform on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || waveformData.length === 0 || dimensions.width === 0 || dimensions.height === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const targetWidth = Math.floor(dimensions.width * dpr);
        const targetHeight = Math.floor(dimensions.height * dpr);

        // Only resize and scale if dimensions changed (avoids clearing context and layout thrashing)
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            canvas.style.width = `${dimensions.width}px`;
            canvas.style.height = `${dimensions.height}px`;
            ctx.scale(dpr, dpr);
        }

        const width = dimensions.width;
        const height = dimensions.height;
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

        // Draw waveform bars
        waveformData.forEach((value, index) => {
            const x = index * barWidth;
            const barHeight = value * (height * 0.8);
            const y = (height - barHeight) / 2;

            // Color based on played position
            if (x < playedPosition) {
                ctx.fillStyle = '#3b82f6'; // blue-500
            } else {
                ctx.fillStyle = '#cbd5e1'; // slate-300
            }

            ctx.fillRect(x, y, barWidth - 1, barHeight);
        });

        // Draw playhead
        ctx.fillStyle = '#ef4444'; // red-500
        ctx.fillRect(playedPosition - 1, 0, 2, height);

    }, [waveformData, currentTime, duration, highlights, dimensions]);

    // Handle click to seek
    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!onSeek || !containerRef.current || duration === 0) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const seekTime = percentage * duration;

        onSeek(Math.max(0, Math.min(seekTime, duration)));
    }, [onSeek, duration]);

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
                // If we are past the start time but not within the highlight,
                // the target must be further to the right.
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
                className="relative h-16 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={handleClick}
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
