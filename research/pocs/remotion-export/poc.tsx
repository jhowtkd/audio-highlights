import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';

// Simple example transcript data
const transcript = [
  { text: "Welcome to AudioHighlights", startFrame: 0, endFrame: 60 },
  { text: "This is a Remotion POC", startFrame: 60, endFrame: 120 },
  { text: "Dynamic burned-in captions", startFrame: 120, endFrame: 180 },
];

export const CaptionSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Find the active caption based on the current frame
  const activeCaption = transcript.find(
    (c) => frame >= c.startFrame && frame < c.endFrame
  );

  return (
    <AbsoluteFill style={{ backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
      {/* Background visual (simple gradient/color for POC) */}
      <AbsoluteFill style={{
        background: 'linear-gradient(to bottom, #1a2a6c, #b21f1f, #fdbb2d)',
        opacity: 0.8
      }} />

      {/* Caption text */}
      {activeCaption && (
        <div style={{
          color: 'white',
          fontSize: '60px',
          fontWeight: 'bold',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          padding: '20px',
          backgroundColor: 'rgba(0,0,0,0.6)',
          borderRadius: '10px',
          zIndex: 10
        }}>
          {activeCaption.text}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const RemotionVideoPOC: React.FC = () => {
  // A standard TikTok/Reels size is 1080x1920
  // For POC we just mock the composition component that Remotion uses
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }}>
      <div style={{ width: '300px', height: '533px', border: '2px solid white', position: 'relative', overflow: 'hidden' }}>
        {/* We would normally render Composition here, but we render the component directly for the POC visualization in browser */}
        <CaptionSequence />
      </div>
      <div style={{ color: 'white', marginLeft: '20px' }}>
        <h2>Remotion Export POC</h2>
        <p>This demonstrates the UI structure for burned-in captions.</p>
        <p>Dependencies needed for actual export: <code>remotion</code>, <code>@remotion/player</code>.</p>
      </div>
    </div>
  );
};

export default RemotionVideoPOC;
