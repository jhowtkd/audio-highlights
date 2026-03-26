import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface Highlight {
    id: string;
    startTime: number;
    endTime: number;
    title: string;
}

interface WaveformProps {
    audioUrl: string;
    highlights?: Highlight[];
    onSeek?: (time: number) => void;
}

export const Waveform: React.FC<WaveformProps> = ({ audioUrl, highlights = [], onSeek }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize wavesurfer
        wavesurfer.current = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#cbd5e1', // slate-300
            progressColor: '#3b82f6', // blue-500
            cursorColor: '#ef4444', // red-500
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 64, // 16 * 4 (h-16)
            backend: 'MediaElement', // Prevents full decode OOM crash
        });

        const ws = wavesurfer.current;

        // Initialize Regions plugin
        const wsRegions = ws.registerPlugin(RegionsPlugin.create());

        ws.on('ready', () => {
            setIsReady(true);

            // Add highlights as regions
            highlights.forEach((h, index) => {
                const colors = [
                    'rgba(239, 68, 68, 0.3)', // red-500
                    'rgba(249, 115, 22, 0.3)', // orange-500
                    'rgba(234, 179, 8, 0.3)', // yellow-500
                    'rgba(34, 197, 94, 0.3)', // green-500
                    'rgba(59, 130, 246, 0.3)', // blue-500
                ];

                wsRegions.addRegion({
                    start: h.startTime,
                    end: h.endTime,
                    content: h.title,
                    color: colors[index % colors.length],
                    drag: false, // interactive editing could be a future feature
                    resize: false
                });
            });
        });

        ws.on('seek', (progress) => {
            if (onSeek) {
                onSeek(progress * ws.getDuration());
            }
        });

        ws.load(audioUrl);

        return () => {
            ws.destroy();
        };
    }, [audioUrl, highlights, onSeek]);

    return (
        <div className="space-y-2">
            {!isReady && (
                <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center">
                    <span className="text-xs text-slate-500">Loading waveform...</span>
                </div>
            )}
            <div
                ref={containerRef}
                className={`relative bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden ${!isReady ? 'hidden' : ''}`}
            />

            {/* Zoom controls could be added here */}
            {isReady && (
                <div className="flex justify-end mt-2">
                    <input
                        type="range"
                        min="1"
                        max="1000"
                        defaultValue="1"
                        onChange={(e) => {
                            if (wavesurfer.current) {
                                wavesurfer.current.zoom(Number(e.target.value));
                            }
                        }}
                        className="w-32"
                        title="Zoom"
                    />
                </div>
            )}
        </div>
    );
};
