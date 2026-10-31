import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { theme } from "./theme";
import { src } from "./components/base";

// Shrink long lines so each stays on one line inside the dark left area.
const fit = (text: string, max: number) => Math.min(max, Math.floor(1150 / Math.max(1, text.length)));

export type ThumbnailProps = { image: string; line1: string; line2: string };

// Reference layout: AI image on the right two thirds, dark left third,
// two lines of heavy caps, the second on a red bar.
export const Thumbnail: React.FC<ThumbnailProps> = ({ image, line1, line2 }) => (
  <AbsoluteFill lang="el" style={{ backgroundColor: "#000", fontFamily: theme.font }}>
    <Img src={src(image)} style={{ position: "absolute", right: 0, top: 0, height: "100%", width: "75%", objectFit: "cover" }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, #000 0%, #000 28%, rgba(0,0,0,0) 55%)" }} />
    <div style={{ position: "absolute", left: 40, top: "50%", transform: "translateY(-50%)", maxWidth: 620 }}>
      <div style={{ color: "#fff", fontSize: fit(line1, 120), whiteSpace: "nowrap", fontWeight: 900, lineHeight: 1, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{line1}</div>
      <div
        style={{
          display: "inline-block",
          marginTop: 14,
          background: theme.color.red,
          color: "#fff",
          fontSize: fit(line2, 104),
          whiteSpace: "nowrap",
          fontWeight: 900,
          lineHeight: 1.05,
          padding: "4px 18px",
          textTransform: "uppercase",
        }}
      >
        {line2}
      </div>
    </div>
  </AbsoluteFill>
);
