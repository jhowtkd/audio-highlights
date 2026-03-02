import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, Video, useCurrentFrame, interpolate } from 'remotion';

// Minimal POC for rendering dynamic captions with Remotion
export const CaptionComposition: React.FC<{
  videoSrc: string;
  transcript: Array<{ start: number; end: number; text: string }>;
}> = ({ videoSrc, transcript }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTime = frame / fps;

  // Find the active transcript word
  const activeWord = transcript.find(
    (word) => currentTime >= word.start && currentTime <= word.end
  );

  // Simple animation for the active word
  const scale = interpolate(
    frame % fps,
    [0, fps / 4],
    [0.8, 1.2],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Video src={videoSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

      {activeWord && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            top: '70%', // Position at the bottom third
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: '80px',
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
              textShadow: '0 4px 8px rgba(0,0,0,0.8)',
              transform: `scale(${scale})`,
              textAlign: 'center',
              textTransform: 'uppercase',
            }}
          >
            {activeWord.text}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
