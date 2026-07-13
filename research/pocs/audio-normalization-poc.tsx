import React, { useEffect, useRef, useState } from 'react';

export function AudioPlayerNormalizationPOC({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  const [isNormalized, setIsNormalized] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const initAudio = () => {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        // Ensure createMediaElementSource is only called once per element
        if (!sourceNodeRef.current) {
          sourceNodeRef.current = ctx.createMediaElementSource(audio);
        }

        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        compressorRef.current = compressor;

        // Default routing: Source -> Destination (No normalization)
        sourceNodeRef.current.connect(ctx.destination);
      }
    };

    audio.addEventListener('play', initAudio, { once: true });

    return () => {
      audio.removeEventListener('play', initAudio);
    };
  }, []);

  const toggleNormalization = () => {
    if (!audioContextRef.current || !sourceNodeRef.current || !compressorRef.current) return;

    const ctx = audioContextRef.current;
    const source = sourceNodeRef.current;
    const compressor = compressorRef.current;

    source.disconnect();

    if (!isNormalized) {
      // Connect through compressor
      source.connect(compressor);
      compressor.connect(ctx.destination);
    } else {
      // Direct connection
      compressor.disconnect();
      source.connect(ctx.destination);
    }

    setIsNormalized(!isNormalized);
  };

  return (
    <div className="p-4 border rounded">
      <audio ref={audioRef} src={src} controls className="mb-4 w-full" />
      <button
        onClick={toggleNormalization}
        className={`px-4 py-2 rounded ${isNormalized ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
      >
        {isNormalized ? 'Disable Normalization' : 'Enable Normalization'}
      </button>
    </div>
  );
}
