import React from "react";
import { AbsoluteFill, Audio, Sequence, useVideoConfig } from "remotion";
import type { Beat, VideoPlan } from "./types";
import { theme } from "./theme";
import { src } from "./components/base";
import { Credit, FadeIn, Kicker, LowerThird, Stamp } from "./components/overlays";
import { renderVisual } from "./templates";

const BeatView: React.FC<{ beat: Beat }> = ({ beat }) => {
  // Footage cuts hard like the reference; graphics fade in over 6 frames.
  const isFootage = beat.visual.type === "footage";
  const body = renderVisual(beat.visual);
  return (
    <AbsoluteFill>
      {isFootage ? body : <FadeIn>{body}</FadeIn>}
      {beat.kicker && <Kicker text={beat.kicker} />}
      {beat.lowerThird && <LowerThird {...beat.lowerThird} />}
      {beat.stamp && <Stamp {...beat.stamp} />}
      {beat.credit && <Credit text={beat.credit} />}
    </AbsoluteFill>
  );
};

export const NewsVideo: React.FC<VideoPlan> = ({ beats, voice, music, musicVolume = 0.12, sfx }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill lang="el" style={{ backgroundColor: "#000", fontFamily: theme.font, color: "#fff" }}>
      {beats.map((b, i) => {
        const from = Math.round(b.start * fps);
        // Hold each beat until the next one starts so there are never gaps.
        const next = beats[i + 1];
        const to = Math.round((next ? next.start : b.end + 0.6) * fps);
        return (
          <Sequence key={b.id} from={from} durationInFrames={Math.max(1, to - from)} name={`${b.id} ${b.visual.type}`}>
            <BeatView beat={b} />
            {sfx?.chapter && b.visual.type === "chapter" && <Audio src={src(sfx.chapter)} volume={0.5} />}
            {sfx?.stamp && b.stamp && (
              <Sequence from={Math.round((b.stamp.at ?? 0.4) * fps)}>
                <Audio src={src(sfx.stamp)} volume={0.5} />
              </Sequence>
            )}
          </Sequence>
        );
      })}
      {voice && <Audio src={src(voice)} />}
      {music && <Audio src={src(music)} volume={musicVolume} loop />}
    </AbsoluteFill>
  );
};
