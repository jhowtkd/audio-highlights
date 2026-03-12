import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig, Audio, Video } from 'remotion';

// Interfaces for our POC structure
interface TranscriptSegment {
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
}

interface VideoExportProps {
  videoUrl: string;
  segments: TranscriptSegment[];
  backgroundColor?: string;
}

/**
 * Proof of Concept: VideoExport component using Remotion
 *
 * This component demonstrates how we can use Remotion to compose a video
 * dynamically using React components, syncing burned-in subtitles (captions)
 * with the underlying video based on transcript segments.
 */
export const VideoExport: React.FC<VideoExportProps> = ({
  videoUrl,
  segments,
  backgroundColor = '#1a1a1a',
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* 1. Play the source video and its audio */}
      <AbsoluteFill>
        <Video src={videoUrl} style={{ objectFit: 'cover' }} />
        <Audio src={videoUrl} />
      </AbsoluteFill>

      {/* 2. Overlay dynamic captions based on transcription segments */}
      <AbsoluteFill style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '10%' }}>
        {segments.map((segment, index) => {
          // Convert seconds to frames
          const startFrame = Math.round(segment.start * fps);
          const endFrame = Math.round(segment.end * fps);
          const durationInFrames = endFrame - startFrame;

          return (
            <Sequence
              key={index}
              from={startFrame}
              durationInFrames={durationInFrames}
            >
              <div
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '60px',
                  fontWeight: 'bold',
                  fontFamily: 'sans-serif',
                  color: 'white',
                  textShadow: '0px 4px 10px rgba(0,0,0,0.8)',
                  padding: '0 40px',
                }}
              >
                {segment.text}
              </div>
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default VideoExport;
