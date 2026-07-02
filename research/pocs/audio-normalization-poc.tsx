import React, { useEffect, useRef, useState } from 'react';

export default function AudioNormalizationPOC() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isNormalized, setIsNormalized] = useState(false);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const toggleNormalization = () => {
    if (!audioRef.current) return;

    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaElementSource(audioRef.current);
      const compressor = audioCtx.createDynamicsCompressor();

      compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
      compressor.knee.setValueAtTime(30, audioCtx.currentTime);
      compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
      compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

      source.connect(compressor);
      compressor.connect(audioCtx.destination);
    }

    setIsNormalized(true);
  };

  return (
    <div className="p-4 border rounded-xl bg-slate-50">
      <h3 className="text-lg font-semibold mb-2">Web Audio API Compressor POC</h3>
      <audio
        ref={audioRef}
        src="/sample-uneven-podcast.mp3"
        controls
        crossOrigin="anonymous"
        className="w-full mb-4"
      />
      <button
        onClick={toggleNormalization}
        disabled={isNormalized}
        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-slate-400"
      >
        {isNormalized ? 'Smart Volume Enabled' : 'Enable Smart Volume'}
      </button>
      <p className="mt-2 text-sm text-slate-600">
        Note: You must play the audio before enabling normalization to satisfy browser autoplay policies.
      </p>
    </div>
  );
}