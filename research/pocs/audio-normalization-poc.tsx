import { useEffect, useRef, useState } from 'react';

export function AudioPlayerWithNormalization({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const [isNormalized, setIsNormalized] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Initialize AudioContext only once
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }

    const ctx = audioCtxRef.current;

    // Create source only once per HTMLMediaElement to avoid InvalidStateError
    if (!sourceRef.current) {
      sourceRef.current = ctx.createMediaElementSource(audio);
    }

    if (!compressorRef.current) {
      compressorRef.current = ctx.createDynamicsCompressor();

      // Configure compressor for podcast/speech normalization
      compressorRef.current.threshold.value = -24; // dB
      compressorRef.current.knee.value = 30; // dB
      compressorRef.current.ratio.value = 12; // High ratio for aggressive leveling
      compressorRef.current.attack.value = 0.003; // Fast attack
      compressorRef.current.release.value = 0.25; // Release
    }

    const source = sourceRef.current;
    const compressor = compressorRef.current;

    // Routing
    source.disconnect();
    if (isNormalized) {
      source.connect(compressor);
      compressor.connect(ctx.destination);
    } else {
      source.connect(ctx.destination);
    }

    return () => {
      // Cleanup is tricky with audio nodes, usually we just disconnect
      source.disconnect();
      compressor.disconnect();
    };
  }, [isNormalized]);

  return (
    <div>
      <audio ref={audioRef} src={src} controls />
      <button onClick={() => setIsNormalized(!isNormalized)}>
        {isNormalized ? 'Disable Normalization' : 'Enable Normalization'}
      </button>
    </div>
  );
}
