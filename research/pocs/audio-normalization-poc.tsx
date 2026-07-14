import { useEffect, useRef, useState } from 'react';

export function AudioPlayerWithNormalization({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isNormalized, setIsNormalized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // We must ensure this only happens once
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      // Track the initialized source to prevent InvalidStateError
      const source = audioCtx.createMediaElementSource(audio);
      sourceRef.current = source;

      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;
      compressorRef.current = compressor;

      // Default: straight to destination
      source.connect(audioCtx.destination);
    }

    return () => {
      // Cleanup if needed, but usually keep context alive for element
    };
  }, []);

  useEffect(() => {
    const audioCtx = audioContextRef.current;
    const source = sourceRef.current;
    const compressor = compressorRef.current;

    if (!audioCtx || !source || !compressor) return;

    // Disconnect existing routing
    source.disconnect();
    compressor.disconnect();

    if (isNormalized) {
      source.connect(compressor);
      compressor.connect(audioCtx.destination);
    } else {
      source.connect(audioCtx.destination);
    }
  }, [isNormalized]);

  return (
    <div>
      <audio ref={audioRef} src={src} controls crossOrigin="anonymous" />
      <button onClick={() => setIsNormalized(!isNormalized)}>
        Toggle Normalization: {isNormalized ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
