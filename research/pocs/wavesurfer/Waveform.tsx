import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { GeneratedHighlight, TranscriptSegment } from '@/types';
import { HIGHLIGHT_COLORS } from '@/lib/constants';

interface WaveformProps {
    audioUrl: string;
    duration: number;
    currentTime: number;
    highlights?: GeneratedHighlight[];
    segments?: TranscriptSegment[];
    onSeek?: (time: number) => void;
    className?: string;
}

export function WaveSurferWaveform({
    audioUrl,
    duration,
    currentTime,
    highlights = [],
    segments = [],
    onSeek,
    className
}: WaveformProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize WaveSurfer with MediaElement backend to avoid OOM
        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#cbd5e1',
            progressColor: '#3b82f6',
            cursorColor: '#ef4444',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 64,
            normalize: true,
            backend: 'MediaElement', // Prevents decodeAudioData OOM for large files
        });

        const wsRegions = wavesurfer.registerPlugin(RegionsPlugin.create());
        regionsRef.current = wsRegions;
        wavesurferRef.current = wavesurfer;

        wavesurfer.load(audioUrl);

        wavesurfer.on('ready', () => {
            setIsReady(true);

            // Add regions for highlights
            highlights.forEach((highlight, index) => {
                wsRegions.addRegion({
                    start: highlight.startTime,
                    end: highlight.endTime,
                    color: HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length].replace('0.3', '0.2'),
                    drag: false,
                    resize: false,
                });
            });
        });

        wavesurfer.on('interaction', (newTime) => {
            if (onSeek) {
                onSeek(newTime);
            }
        });

        return () => {
            wavesurfer.destroy();
        };
    }, [audioUrl]);

    // Update current time when it changes externally
    useEffect(() => {
        if (wavesurferRef.current && isReady) {
            // Only seek if difference is significant to avoid stuttering
            const wsTime = wavesurferRef.current.getCurrentTime();
            if (Math.abs(wsTime - currentTime) > 0.1) {
                wavesurferRef.current.setTime(currentTime);
            }
        }
    }, [currentTime, isReady]);

    return (
        <div className={className}>
            <div ref={containerRef} className="w-full relative bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden" />
            {!isReady && (
                <div className="text-xs text-slate-500 mt-1 text-center animate-pulse">
                    Carregando waveform...
                </div>
            )}
        </div>
    );
}

export default WaveSurferWaveform;
