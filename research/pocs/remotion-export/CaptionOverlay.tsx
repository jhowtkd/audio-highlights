import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

// Interfaces for our transcription data
interface Word {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
}

interface CaptionOverlayProps {
  words: Word[];
}

/**
 * POC for rendering dynamic captions with Remotion.
 * It maps transcript word timestamps to video frames to highlight the currently spoken word,
 * mimicking the "viral" TikTok/Reels caption style.
 */
export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate current time in seconds based on the current frame
  const currentTime = frame / fps;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        padding: '40px',
        position: 'absolute',
        bottom: '10%', // Position near the bottom, typical for social videos
        width: '100%',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
      }}
    >
      {words.map((w, index) => {
        // A word is active if the current time falls between its start and end timestamps
        const isActive = currentTime >= w.start && currentTime <= w.end;
        // Optionally, we could show past words in a different color, or just show the active sentence chunk.
        // For this simple POC, we'll just highlight the active word in a bright color.

        return (
          <span
            key={index}
            style={{
              fontSize: '80px',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 'bold',
              margin: '0 10px',
              lineHeight: '1.2',
              color: isActive ? '#facc15' : 'white', // yellow if active, white otherwise
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.1s ease-in-out',
              display: 'inline-block',
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};
