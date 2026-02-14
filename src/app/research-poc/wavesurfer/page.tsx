'use client';

import dynamic from 'next/dynamic';

const WavesurferPOC = dynamic(
  () => import('./components/wavesurfer-poc'),
  { ssr: false }
);

export default function WavesurferPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Research POC: Wavesurfer.js
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          This POC demonstrates advanced waveform navigation using wavesurfer.js v7 with Zoom and Regions plugins.
          Audio is synthesized in the browser (sine wave) to avoid external dependencies.
        </p>

        <div className="mt-8">
          <WavesurferPOC />
        </div>

        <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm text-slate-500">
            <h3 className="font-semibold mb-2">Features Verified:</h3>
            <ul className="list-disc list-inside space-y-1">
                <li>Waveform rendering (MediaElement backend via Blob URL)</li>
                <li>Zoom capability (minPxPerSec)</li>
                <li>Regions Plugin (draggable highlights)</li>
                <li>Timeline Plugin (time axis)</li>
                <li>Synthetic audio generation (WAV Blob)</li>
            </ul>
        </div>
      </div>
    </div>
  );
}
