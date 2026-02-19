import { WaveformPoc } from '@/components/audio/waveform-poc';

export default function PocWaveformPage() {
  return (
    <div className="container mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">Advanced Waveform Navigation POC</h2>
      <p className="mb-4 text-slate-600 dark:text-slate-400">
        This page demonstrates the integration of `wavesurfer.js` for precise audio navigation, zooming, and region selection.
      </p>

      <div className="max-w-4xl mx-auto">
        <WaveformPoc audioUrl="/sample-audio.wav" />
      </div>

      <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
        <h3 className="font-semibold mb-2">Technical Details</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
          <li>Uses `wavesurfer.js` v7.</li>
          <li>Includes `RegionsPlugin` for Highlights visualization and editing.</li>
          <li>Includes `TimelinePlugin` for time axis.</li>
          <li>Performance: Efficient rendering with canvas.</li>
          <li>Interactivity: Zoom slider, drag-to-seek, region manipulation.</li>
        </ul>
      </div>
    </div>
  );
}
