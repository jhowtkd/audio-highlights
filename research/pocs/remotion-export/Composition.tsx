import { AbsoluteFill, useVideoConfig } from 'remotion';

export const MyComposition = () => {
  const { fps, durationInFrames, width, height } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 100,
        backgroundColor: 'white',
      }}
    >
      The current frame is {fps}fps, {durationInFrames} frames, {width}x{height}px.
    </AbsoluteFill>
  );
};
