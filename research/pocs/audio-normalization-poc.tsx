import React, { useEffect, useRef, useState } from 'react';

export function AudioNormalizationPOC() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const [isNormalized, setIsNormalized] = useState(false);

  useEffect(() => {
    // Create AudioContext only once on mount
    contextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      contextRef.current?.close();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && audioRef.current) {
      audioRef.current.src = URL.createObjectURL(file);
      audioRef.current.load();
    }
  };

  const setupWebAudio = () => {
    if (!audioRef.current || !contextRef.current) return;
    if (contextRef.current.state === 'suspended') {
      contextRef.current.resume();
    }

    // Ensure source node is only created once per HTMLMediaElement to prevent InvalidStateError
    if (!sourceNodeRef.current) {
      sourceNodeRef.current = contextRef.current.createMediaElementSource(audioRef.current);
    }

    if (!compressorNodeRef.current) {
      const compressor = contextRef.current.createDynamicsCompressor();
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;
      compressorNodeRef.current = compressor;
    }

    applyNormalization(isNormalized);
  };

  const applyNormalization = (normalize: boolean) => {
    if (!contextRef.current || !sourceNodeRef.current || !compressorNodeRef.current) return;

    // Disconnect existing routing
    sourceNodeRef.current.disconnect();
    compressorNodeRef.current.disconnect();

    if (normalize) {
      // Route: Audio -> Compressor -> Destination
      sourceNodeRef.current.connect(compressorNodeRef.current);
      compressorNodeRef.current.connect(contextRef.current.destination);
    } else {
      // Route: Audio -> Destination
      sourceNodeRef.current.connect(contextRef.current.destination);
    }
  };

  useEffect(() => {
    applyNormalization(isNormalized);
  }, [isNormalized]);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Web Audio API Normalization POC</h3>
      <input type="file" accept="audio/*,video/*" onChange={handleFileChange} className="mb-4 block" />
      <audio
        ref={audioRef}
        controls
        className="mb-4 w-full"
        onPlay={setupWebAudio}
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="normalize"
          checked={isNormalized}
          onChange={(e) => setIsNormalized(e.target.checked)}
        />
        <label htmlFor="normalize">Enable Volume Normalization (Compressor)</label>
      </div>
    </div>
  );
}