import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence, Audio, Video } from 'remotion';

// Simulated transcript data structure from our AudioHighlights API
const mockTranscriptSegments = [
  { start: 0, end: 1.5, text: "Welcome to" },
  { start: 1.5, end: 3.0, text: "AudioHighlights," },
  { start: 3.0, end: 5.5, text: "the best tool for podcasters." }
];

export const VideoWithCaptions = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Determine current time in seconds based on current frame and fps
  const currentTime = frame / fps;

  // Find the active caption for the current time
  const currentCaption = mockTranscriptSegments.find(
    (item) => currentTime >= item.start && currentTime < item.end
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#111827', color: 'white' }}>
      {/*
        In a full implementation, we would include the source media:
        <Video src={mediaUrl} /> or <Audio src={audioUrl} />
      */}

      {/* Mock background / Visualizer */}
      <AbsoluteFill style={{
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)'
      }}>
        {/* Simple mock waveform animation */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: '16px',
                height: `${40 + Math.sin((frame + i * 10) / 5) * 40}px`,
                backgroundColor: '#3b82f6',
                borderRadius: '8px'
              }}
            />
          ))}
        </div>
      </AbsoluteFill>

      {/* Dynamic Burned-in Captions */}
      <AbsoluteFill style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: '80px'
      }}>
        {currentCaption && (
          <div style={{
            textAlign: 'center',
            fontSize: '64px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 800,
            color: 'white',
            textShadow: '0 4px 12px rgba(0,0,0,0.5)',
            maxWidth: '80%'
          }}>
            <span style={{
              backgroundColor: 'rgba(59, 130, 246, 0.9)', // Tailwind blue-500
              padding: '12px 24px',
              borderRadius: '16px',
              display: 'inline-block',
              lineHeight: 1.2
            }}>
              {currentCaption.text}
            </span>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
