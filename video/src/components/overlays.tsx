import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { useIn } from "./base";

export const Kicker: React.FC<{ text: string }> = ({ text }) => {
  const p = useIn(2);
  return (
    <div
      style={{
        position: "absolute",
        top: 54,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
        opacity: p,
        fontSize: 20,
        fontWeight: 600,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: theme.color.grey,
      }}
    >
      <span style={{ width: 12, height: 12, borderRadius: 6, background: theme.color.red }} />
      {text}
    </div>
  );
};

// Rubber stamp that slams in, tilted, with a rough edge.
export const Stamp: React.FC<{ text: string; color?: "red" | "yellow"; at?: number; style?: React.CSSProperties }> = ({
  text,
  color = "red",
  at = 0.4,
  style,
}) => {
  const { fps } = useVideoConfig();
  const p = useIn(Math.round(at * fps), 9);
  const c = color === "red" ? theme.color.red : theme.color.yellow;
  return (
    <div
      style={{
        position: "absolute",
        right: 160,
        bottom: 200,
        transform: `rotate(-8deg) scale(${interpolate(p, [0, 1], [2.2, 1])})`,
        opacity: interpolate(p, [0, 0.3], [0, 0.95], { extrapolateRight: "clamp" }),
        border: `6px solid ${c}`,
        color: c,
        padding: "10px 26px",
        fontSize: 54,
        fontWeight: 900,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
        background: color === "yellow" ? "rgba(246,185,26,0.12)" : "rgba(211,32,46,0.08)",
        maskImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.7' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>\")",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

export const LowerThird: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const p = useIn(6);
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        bottom: 110,
        display: "flex",
        transform: `translateX(${interpolate(p, [0, 1], [-40, 0])}px)`,
        opacity: p,
      }}
    >
      <div style={{ width: 8, background: theme.color.red }} />
      <div style={{ background: "rgba(20,18,17,0.72)", padding: "18px 30px 18px 26px" }}>
        <div style={{ fontSize: 44, fontWeight: 800, textTransform: "uppercase" }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: theme.color.grey, marginTop: 6 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export const Credit: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: "absolute",
      right: 40,
      bottom: 28,
      fontSize: 16,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.75)",
    }}
  >
    {text}
  </div>
);

export const FadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
};
