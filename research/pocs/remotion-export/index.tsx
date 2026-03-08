import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, Audio, Img } from "remotion";
import React from "react";

// Mock data for the POC
const transcript = [
  { text: "This is a Remotion POC", start: 0, end: 60 },
  { text: "for dynamic captions", start: 60, end: 120 },
  { text: "and custom backgrounds.", start: 120, end: 180 },
];

export const HighlightVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find the current subtitle based on the frame
  const currentSubtitle = transcript.find(
    (t) => frame >= t.start && frame < t.end
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center" }}>
      {/* Background Layer */}
      <AbsoluteFill>
         <div style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(to bottom right, #4facfe 0%, #00f2fe 100%)",
            opacity: 0.5
         }} />
      </AbsoluteFill>

      {/* Title Layer */}
      <Sequence from={0} durationInFrames={180}>
        <div style={{
            position: "absolute",
            top: "10%",
            width: "100%",
            textAlign: "center",
            color: "white",
            fontSize: "60px",
            fontFamily: "sans-serif",
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
        }}>
            AudioHighlights Export
        </div>
      </Sequence>

      {/* Captions Layer */}
      <Sequence from={0} durationInFrames={180}>
        {currentSubtitle && (
          <div
            style={{
              position: "absolute",
              bottom: "20%",
              width: "80%",
              textAlign: "center",
              color: "white",
              fontSize: "80px",
              fontFamily: "sans-serif",
              fontWeight: "900",
              WebkitTextStroke: "3px black",
              textShadow: "0px 10px 20px rgba(0,0,0,0.8)",
              transform: `scale(${1 + Math.sin(frame / 5) * 0.05})`, // Simple bouncy animation
              transition: "transform 0.1s ease-in-out"
            }}
          >
            {currentSubtitle.text}
          </div>
        )}
      </Sequence>
    </AbsoluteFill>
  );
};
