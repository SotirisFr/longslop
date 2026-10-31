import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { theme } from "../theme";

const weights: [string, string][] = [
  ["400", "Regular"],
  ["500", "Medium"],
  ["600", "SemiBold"],
  ["700", "Bold"],
  ["800", "ExtraBold"],
  ["900", "Black"],
];
export const fontsReady = Promise.all(
  weights.map(([weight, name]) =>
    loadFont({ family: theme.font, url: staticFile(`fonts/Inter-${name}.otf`), weight }),
  ),
);

// Files in public/ are referenced by name; URLs pass through.
export const src = (s: string) => (/^(https?:|data:|\/)/.test(s) ? s : staticFile(s));

export const useIn = (delay = 0, damping = 16) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.7 } });
};

export const Background: React.FC<{ children?: React.ReactNode; red?: boolean }> = ({ children, red }) => (
  <AbsoluteFill
    style={{
      background: red
        ? `radial-gradient(ellipse at 50% 45%, #e0283a 0%, ${theme.color.red} 45%, ${theme.color.redDark} 100%)`
        : `radial-gradient(ellipse at 50% 45%, ${theme.color.bgInner} 0%, #2a2725 55%, ${theme.color.bgOuter} 100%)`,
      fontFamily: theme.font,
      color: theme.color.white,
    }}
  >
    {children}
  </AbsoluteFill>
);

// Slow push-in used on every photo and clip, like the reference.
export const Media: React.FC<{ file: string; kind?: "video" | "image"; grade?: "color" | "bw"; dim?: number; startFrom?: number }> = ({
  file,
  kind,
  grade = "color",
  dim = 0,
  startFrom = 0,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1.04, 1.12]);
  const isVideo = kind ? kind === "video" : /\.(mp4|mov|webm)$/i.test(file);
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: `scale(${scale})`,
    filter: grade === "bw" ? "grayscale(1) contrast(1.1)" : "saturate(0.9) contrast(1.05)",
  };
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      {isVideo ? <OffthreadVideo src={src(file)} style={style} muted startFrom={startFrom} /> : <Img src={src(file)} style={style} />}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)" }} />
      {dim > 0 && <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${dim})` }} />}
      {grade === "bw" && <Grain />}
    </AbsoluteFill>
  );
};

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.12, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id={`g${frame % 4}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 4} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${frame % 4})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Caps: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.01em", lineHeight: 1.1, ...style }}>{children}</div>
);
