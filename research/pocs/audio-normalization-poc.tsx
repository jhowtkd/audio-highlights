import { useEffect, useRef, useState } from 'react';

export function AudioNormalizationPOC({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isNormalized, setIsNormalized] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(audio);
      sourceNodeRef.current = source;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressorRef.current = compressor;

      source.connect(ctx.destination);
    }

    return () => {
    };
  }, []);

  const toggleNormalization = () => {
    if (!audioCtxRef.current || !sourceNodeRef.current || !compressorRef.current) return;

    const ctx = audioCtxRef.current;
    const source = sourceNodeRef.current;
    const compressor = compressorRef.current;

    source.disconnect();
    compressor.disconnect();

    if (!isNormalized) {
      source.connect(compressor);
      compressor.connect(ctx.destination);
    } else {
      source.connect(ctx.destination);
    }

    setIsNormalized(!isNormalized);

    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  };

  return (
    <div>
      <audio ref={audioRef} src={src} controls />
      <button onClick={toggleNormalization}>
        {isNormalized ? 'Disable Normalization' : 'Enable Normalization'}
      </button>
    </div>
  );
}
