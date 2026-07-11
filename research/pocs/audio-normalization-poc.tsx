'use client';
import { useEffect, useRef, useState } from 'react';

export default function AudioNormalizationPOC() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const [isNormalized, setIsNormalized] = useState(false);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  const toggleNormalization = () => {
    if (!audioRef.current) return;

    // Initialize AudioContext if it doesn't exist yet
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create MediaElementSource ONLY ONCE per audio element
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);

      // Create compressor node
      compressorRef.current = audioContextRef.current.createDynamicsCompressor();

      // Initial routing (bypass compressor)
      sourceRef.current.connect(audioContextRef.current.destination);
    }

    const ctx = audioContextRef.current;
    const source = sourceRef.current!;
    const compressor = compressorRef.current!;

    // Disconnect current routing
    source.disconnect();
    compressor.disconnect();

    if (!isNormalized) {
      // Connect through compressor for normalization
      // Settings optimized for spoken word (podcasts/dialogue)
      compressor.threshold.value = -30;    // Start compressing early
      compressor.knee.value = 10;          // Soft knee
      compressor.ratio.value = 4;          // Standard dialogue ratio
      compressor.attack.value = 0.005;     // Fast attack
      compressor.release.value = 0.1;      // Fast release

      source.connect(compressor);
      compressor.connect(ctx.destination);
      setIsNormalized(true);
    } else {
      // Bypass compressor
      source.connect(ctx.destination);
      setIsNormalized(false);
    }

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3>Audio Volume Normalization POC</h3>
      <audio
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        controls
        className="w-full my-4"
      />
      <button
        onClick={toggleNormalization}
        className={`px-4 py-2 rounded ${isNormalized ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
      >
        {isNormalized ? 'Disable Normalization' : 'Enable Normalization'}
      </button>
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Status:</strong> {isNormalized ? 'Compressor Active' : 'Bypassed'}</p>
        <p>This POC uses the Web Audio API DynamicsCompressorNode to normalize volume levels dynamically in the browser, preventing listeners from having to constantly adjust their volume for quiet/loud sections of a podcast.</p>
      </div>
    </div>
  );
}
