import React, { useEffect, useRef, useState } from 'react';

export default function AudioNormalizationPoC() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isNormalized, setIsNormalized] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    useEffect(() => {
        return () => {
            if (audioCtxRef.current?.state !== 'closed') {
                audioCtxRef.current?.close();
            }
        };
    }, []);

    const toggleNormalization = () => {
        if (!audioRef.current) return;

        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContext();
            sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
            compressorRef.current = audioCtxRef.current.createDynamicsCompressor();

            compressorRef.current.threshold.value = -24;
            compressorRef.current.knee.value = 30;
            compressorRef.current.ratio.value = 12;
            compressorRef.current.attack.value = 0.003;
            compressorRef.current.release.value = 0.25;
        }

        const ctx = audioCtxRef.current;
        const source = sourceRef.current!;
        const compressor = compressorRef.current!;

        if (!isNormalized) {
            source.disconnect();
            source.connect(compressor);
            compressor.connect(ctx.destination);
        } else {
            source.disconnect();
            compressor.disconnect();
            source.connect(ctx.destination);
        }

        setIsNormalized(!isNormalized);
    };

    return (
        <div className="p-4 border rounded-xl max-w-md bg-white">
            <h3 className="text-lg font-bold mb-4">Real-time Audio Normalization PoC</h3>
            <audio
                ref={audioRef}
                src="https://www.w3schools.com/html/horse.ogg"
                controls
                crossOrigin="anonymous"
                className="w-full mb-4"
            />
            <div className="flex items-center justify-between">
                <span>Dynamic Range Compression: {isNormalized ? 'ON' : 'OFF'}</span>
                <button
                    onClick={toggleNormalization}
                    className={`px-4 py-2 rounded font-medium ${isNormalized ? 'bg-green-500 text-white' : 'bg-gray-200 text-black'}`}
                >
                    Toggle Normalization
                </button>
            </div>
        </div>
    );
}
