'use client';
import { useEffect, useRef, useState } from 'react';
export function AudioPlayerWithNormalization({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isNormalized, setIsNormalized] = useState(false);
  useEffect(() => {
    if (!audioRef.current || !isNormalized) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audioRef.current);
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
    compressor.knee.setValueAtTime(40, audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
    compressor.attack.setValueAtTime(0, audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);
    source.connect(compressor);
    compressor.connect(audioContext.destination);
    return () => {
      source.disconnect();
      compressor.disconnect();
      audioContext.close();
    };
  }, [isNormalized]);
  return (
    <div>
      <audio ref={audioRef} src={src} controls />
      <button onClick={() => setIsNormalized(!isNormalized)}>Toggle Normalization</button>
    </div>
  );
}
