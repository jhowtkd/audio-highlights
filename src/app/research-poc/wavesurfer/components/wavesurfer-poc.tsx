'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Plus } from 'lucide-react';

/**
 * Generates a simple sine wave WAV blob.
 * @param durationSeconds Duration in seconds
 * @param frequency Frequency in Hz
 * @returns Blob representing a WAV file
 */
function generateSineWaveWav(durationSeconds: number, frequency: number = 440): Blob {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = sampleRate * durationSeconds;

  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, byteRate, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitsPerSample, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Write the PCM samples
  // const volume = 0.5; // Unused
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Generate sine wave
    const sample = Math.sin(2 * Math.PI * frequency * t);
    // Convert to 16-bit PCM
    const s = Math.max(-1, Math.min(1, sample));
    // scale to 16-bit signed integer range
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export default function WavesurferPOC() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const regionsRef = useRef<any>(null); // Type 'any' for plugin as strict types might need setup
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(10); // minPxPerSec
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || wsRef.current) return;

    // Create synthetic audio
    const audioBlob = generateSineWaveWav(30, 440); // 30 seconds of 440Hz sine wave
    const audioUrl = URL.createObjectURL(audioBlob);

    // Initialize WaveSurfer
    const ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: 'rgb(75, 85, 99)', // slate-600
        progressColor: 'rgb(59, 130, 246)', // blue-500
        url: audioUrl,
        minPxPerSec: zoom,
        height: 128,
    });

    // Register plugins
    const wsRegions = ws.registerPlugin(RegionsPlugin.create());
    ws.registerPlugin(TimelinePlugin.create({ container: timelineRef.current! }));

    regionsRef.current = wsRegions;
    wsRef.current = ws;

    ws.on('ready', () => {
      setReady(true);
      // Add a sample region
      wsRegions.addRegion({
        start: 2,
        end: 10,
        content: 'Sample Region',
        color: 'rgba(255, 0, 0, 0.1)',
        drag: true,
        resize: true,
      });
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    return () => {
      ws.destroy();
      URL.revokeObjectURL(audioUrl);
      wsRef.current = null; // Clear ref
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Update zoom
  useEffect(() => {
    if (wsRef.current && ready) {
      wsRef.current.zoom(zoom);
    }
  }, [zoom, ready]);

  const togglePlay = () => {
    if (wsRef.current) {
      wsRef.current.playPause();
    }
  };

  const addRegion = () => {
    if (wsRef.current && regionsRef.current) {
      const currentTime = wsRef.current.getCurrentTime();
      regionsRef.current.addRegion({
        start: currentTime,
        end: currentTime + 5,
        content: 'New Highlight',
        color: 'rgba(0, 255, 0, 0.1)',
      });
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Button onClick={togglePlay} disabled={!ready}>
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button variant="outline" onClick={addRegion} disabled={!ready}>
                <Plus className="w-4 h-4 mr-2" />
                Add Region
            </Button>
        </div>

        <div className="flex items-center gap-4 w-1/3">
            <span className="text-sm text-slate-500">Zoom</span>
            <Slider
                value={[zoom]}
                min={10}
                max={200}
                step={10}
                onValueChange={(vals) => setZoom(vals[0])}
                className="w-full"
            />
            <span className="text-xs w-8">{zoom}</span>
        </div>
      </div>

      <div className="relative border rounded bg-slate-50 dark:bg-slate-950 p-2">
        <div id="waveform" ref={containerRef} className="w-full" />
        <div id="timeline" ref={timelineRef} className="w-full" />
      </div>

      {!ready && <div className="text-center text-sm text-slate-400">Loading audio...</div>}
    </div>
  );
}
