'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

// Helper to create a silent/tone WAV blob for testing
const createAudioBlob = () => {
  const sampleRate = 44100;
  const duration = 60; // 60 seconds
  const numChannels = 1;
  const numSamples = sampleRate * duration;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + numSamples * 2, true);
  // RIFF type
  writeString(8, 'WAVE');
  // format chunk identifier
  writeString(12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(36, 'data');
  // data chunk length
  view.setUint32(40, numSamples * 2, true);

  // Write sine wave data
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const frequency = 440; // A4
    const amplitude = 0.5;
    // Simple sine wave
    const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude;
    // Convert to 16-bit PCM
    const s = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

export default function WaveformPOC() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState([10]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !timelineRef.current) return;

    // Create regions plugin
    const wsRegions = RegionsPlugin.create();

    // Create wavesurfer
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgb(59, 130, 246)',
      progressColor: 'rgb(37, 99, 235)',
      height: 128,
      minPxPerSec: 10,
      plugins: [
        wsRegions,
        TimelinePlugin.create({
          container: timelineRef.current,
        }),
      ],
    });

    wavesurferRef.current = ws;

    // Load audio
    const blob = createAudioBlob();
    const url = URL.createObjectURL(blob);
    ws.load(url);

    ws.on('ready', () => {
      setIsReady(true);
      // Add a test region
      wsRegions.addRegion({
        start: 5,
        end: 10,
        content: 'Highlight 1',
        color: 'rgba(59, 130, 246, 0.2)',
        drag: true,
        resize: true,
      });

      wsRegions.addRegion({
        start: 20,
        end: 35,
        content: 'Highlight 2',
        color: 'rgba(236, 72, 153, 0.2)',
        drag: true,
        resize: true,
      });
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    return () => {
      ws.destroy();
      URL.revokeObjectURL(url);
    };
  }, []);

  // Update zoom when slider changes
  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.zoom(zoom[0]);
    }
  }, [zoom, isReady]);

  const togglePlay = () => {
    wavesurferRef.current?.playPause();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Research POC: Advanced Waveform (Wavesurfer.js)
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
            Testing integration of wavesurfer.js with regions and zoom.
            </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div ref={containerRef} id="waveform" />
          <div ref={timelineRef} id="timeline" />

          <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={togglePlay} disabled={!isReady}>
              {isPlaying ? 'Pause' : 'Play'}
            </Button>

            <div className="flex-1 flex items-center gap-4">
                <span className="text-sm font-medium">Zoom: {zoom[0]}px/s</span>
                <Slider
                    value={zoom}
                    onValueChange={setZoom}
                    min={10}
                    max={200}
                    step={1}
                    className="w-64"
                />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200">
            <strong>Features Verified:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Waveform rendering (using synthetic blob)</li>
                <li>Zoom capability (minPxPerSec)</li>
                <li>Interactive Regions (drag & resize)</li>
                <li>Timeline plugin integration</li>
                <li>Play/Pause control</li>
            </ul>
        </div>
      </div>
    </div>
  );
}
