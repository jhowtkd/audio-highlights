import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface WaveformProps {
    audioUrl: string;
}

export function Waveform({ audioUrl }: WaveformProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#cbd5e1',
            progressColor: '#3b82f6',
            url: audioUrl,
            minPxPerSec: 100, // Enables zooming capability
            cursorColor: '#ef4444',
            plugins: [
                 RegionsPlugin.create()
            ]
        });

        wavesurferRef.current = wavesurfer;

        return () => {
            wavesurfer.destroy();
        };
    }, [audioUrl]);

    return <div ref={containerRef} />;
}
