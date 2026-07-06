import React, { useEffect, useRef, useState } from 'react';

export default function AudioNormalizationPoC({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  const [isNormalized, setIsNormalized] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Initialize Web Audio API only once
    if (!audioContextRef.current) {
      // Create context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      // createMediaElementSource must only be called ONCE per HTMLMediaElement
      // Tracking it with sourceNodeRef prevents InvalidStateError
      const source = ctx.createMediaElementSource(audio);
      sourceNodeRef.current = source;

      // Create compressor
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressorRef.current = compressor;

      // Default: bypass compressor (connect source directly to destination)
      source.connect(ctx.destination);
    }

    return () => {
      // Cleanup happens on component unmount
      if (audioContextRef.current?.state !== 'closed') {
         sourceNodeRef.current?.disconnect();
         compressorRef.current?.disconnect();
         audioContextRef.current?.close();
         audioContextRef.current = null;
         sourceNodeRef.current = null;
      }
    };
  }, []);

  const toggleNormalization = () => {
    const ctx = audioContextRef.current;
    const source = sourceNodeRef.current;
    const compressor = compressorRef.current;

    if (!ctx || !source || !compressor) return;

    // Disconnect existing routing
    source.disconnect();
    compressor.disconnect();

    if (isNormalized) {
      // Bypass normalization
      source.connect(ctx.destination);
    } else {
      // Apply normalization
      source.connect(compressor);
      compressor.connect(ctx.destination);

      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    }

    setIsNormalized(!isNormalized);
  };

  return (
    <div className="p-4 border rounded-xl">
      <h3 className="text-lg font-bold mb-4">Audio Normalization PoC</h3>

      <audio
        ref={audioRef}
        src={src}
        controls
        className="mb-4 w-full"
        crossOrigin="anonymous"
      />

      <button
        onClick={toggleNormalization}
        className={`px-4 py-2 rounded ${isNormalized ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
      >
        {isNormalized ? 'Normalization: ON' : 'Normalization: OFF'}
      </button>

      <div className="mt-4 text-sm text-gray-600">
        <p>Using Web Audio API <code>DynamicsCompressorNode</code> for real-time volume leveling.</p>
      </div>
    </div>
  );
}
