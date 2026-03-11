import React from 'react';
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';

// Note: This is a Proof of Concept component for the Remotion integration.
// It relies on 'remotion' which might not be installed in the main package.json yet.

interface Segment {
  text: string;
  start: number;
  end: number;
}

interface VideoExportProps {
  audioUrl: string;
  segments: Segment[];
  title: string;
}

export const VideoExport: React.FC<VideoExportProps> = ({ audioUrl, segments, title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find the active segment based on current frame
  const currentTime = frame / fps;
  const activeSegment = segments.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#111827', color: 'white', fontFamily: 'sans-serif' }}>
      {/* Background or visualizer could go here */}

      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <h1 style={{ fontSize: '40px', marginBottom: '20px', color: '#60A5FA', textAlign: 'center' }}>
          {title}
        </h1>

        {/* Dynamic Caption Container */}
        <div
          style={{
            fontSize: '60px',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: 1.2,
            textShadow: '0 4px 8px rgba(0,0,0,0.5)',
            // Simple animation: pop in when active
            transform: activeSegment ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.1s ease-out'
          }}
        >
          {activeSegment ? activeSegment.text : ''}
        </div>
      </AbsoluteFill>

      {/* Audio track synced to the video */}
      <Audio src={audioUrl} />

      {/* Example Progress Bar */}
      <Sequence from={0}>
         <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '10px',
            backgroundColor: '#3B82F6',
            width: `${(frame / (segments[segments.length - 1]?.end * fps || 1)) * 100}%`
         }} />
      </Sequence>
    </AbsoluteFill>
  );
};
