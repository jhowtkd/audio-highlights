import React from 'react';
import { AbsoluteFill, useVideoConfig, Sequence, Audio, Img } from 'remotion';

// Minimal Proof of Concept for Remotion Video Export
// This component demonstrates rendering a video with a background, audio, and dynamic captions

interface Subtitle {
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

interface VideoExportProps {
  audioUrl: string;
  backgroundUrl: string;
  subtitles: Subtitle[];
}

export const VideoExport: React.FC<VideoExportProps> = ({
  audioUrl,
  backgroundUrl,
  subtitles,
}) => {
  const { fps, width, height, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Background Image/Video */}
      <AbsoluteFill>
        <Img src={backgroundUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>

      {/* Main Audio Track */}
      <Audio src={audioUrl} />

      {/* Dynamic Subtitles */}
      {subtitles.map((subtitle, index) => {
        const startFrame = Math.round(subtitle.start * fps);
        const endFrame = Math.round(subtitle.end * fps);
        const durationFrames = endFrame - startFrame;

        // Skip invalid subtitles
        if (durationFrames <= 0) return null;

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            <AbsoluteFill
              style={{
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: '100px', // Position from bottom
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '20px 40px',
                  borderRadius: '20px',
                  fontSize: '60px', // Scaled for video resolution (e.g., 1080x1920)
                  fontFamily: 'sans-serif',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  maxWidth: '80%',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                {subtitle.text}
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// Example usage setup (to be placed in a Remotion Root component)
/*
import { Composition } from 'remotion';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoExport"
        component={VideoExport}
        durationInFrames={300} // Example duration (10 seconds @ 30fps)
        fps={30}
        width={1080}
        height={1920} // 9:16 aspect ratio for Shorts/Reels/TikTok
        defaultProps={{
          audioUrl: "https://example.com/audio.mp3",
          backgroundUrl: "https://example.com/bg.jpg",
          subtitles: [
            { start: 0, end: 2, text: "Hello world!" },
            { start: 2, end: 5, text: "This is a Remotion test." }
          ]
        }}
      />
    </>
  );
};
*/
