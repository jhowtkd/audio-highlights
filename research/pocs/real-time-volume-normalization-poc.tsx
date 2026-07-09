import React, { useEffect, useRef, useState } from 'react';

export default function VolumeNormalizationPOC() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const [isNormalized, setIsNormalized] = useState(false);

  useEffect(() => {
    // Cleanup function
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const toggleNormalization = () => {
    if (!audioRef.current) return;

    if (!audioContextRef.current) {
      // Initialize AudioContext on first user interaction
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
    }

    const ctx = audioContextRef.current;

    // Only create source node once per media element to avoid InvalidStateError
    if (!sourceNodeRef.current) {
      sourceNodeRef.current = ctx.createMediaElementSource(audioRef.current);
    }

    if (!isNormalized) {
      // Create and configure compressor node
      if (!compressorNodeRef.current) {
        compressorNodeRef.current = ctx.createDynamicsCompressor();
        compressorNodeRef.current.threshold.value = -24;
        compressorNodeRef.current.knee.value = 30;
        compressorNodeRef.current.ratio.value = 12;
        compressorNodeRef.current.attack.value = 0.003;
        compressorNodeRef.current.release.value = 0.25;
      }

      // Connect: Source -> Compressor -> Destination
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current.connect(compressorNodeRef.current);
      compressorNodeRef.current.connect(ctx.destination);
      setIsNormalized(true);
    } else {
      // Connect: Source -> Destination (bypass compressor)
      sourceNodeRef.current.disconnect();
      if (compressorNodeRef.current) {
        compressorNodeRef.current.disconnect();
      }
      sourceNodeRef.current.connect(ctx.destination);
      setIsNormalized(false);
    }

    // Resume context if it was suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-lg font-bold mb-4">Volume Normalization POC</h2>
      <audio
        ref={audioRef}
        src="https://www.w3schools.com/html/horse.ogg"
        controls
        crossOrigin="anonymous"
        className="w-full mb-4"
      />
      <button
        onClick={toggleNormalization}
        className={`px-4 py-2 rounded-md ${isNormalized ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'}`}
      >
        {isNormalized ? 'Normalization Active' : 'Enable Normalization'}
      </button>
    </div>
  );
}
