import React from 'react';
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';

// Interfaces based on application context
export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface HighlightVideoProps {
  audioUrl: string;
  segments: TranscriptSegment[];
  highlightStart: number;
  highlightEnd: number;
}

export const HighlightVideo: React.FC<HighlightVideoProps> = ({
  audioUrl,
  segments,
  highlightStart,
  highlightEnd,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Determine current active segment for burned-in captions
  const currentTime = highlightStart + frame / fps;
  const activeSegment = segments.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
      {/* Background audio playback trimmed to the highlight duration */}
      <Sequence from={0} durationInFrames={Math.ceil((highlightEnd - highlightStart) * fps)}>
        <Audio src={audioUrl} startFrom={Math.ceil(highlightStart * fps)} />
      </Sequence>

      {/* Burned-in caption visualization */}
      {activeSegment && (
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            color: 'white',
            fontSize: '48px',
            fontFamily: 'sans-serif',
            textAlign: 'center',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '10px',
            maxWidth: '80%',
          }}
        >
          {activeSegment.text}
        </div>
      )}
    </AbsoluteFill>
  );
};
