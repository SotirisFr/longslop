import React from "react";
import { Composition, Still, continueRender, delayRender } from "remotion";
import { NewsVideo } from "./NewsVideo";
import { Thumbnail, type ThumbnailProps } from "./Thumbnail";
import { fontsReady } from "./components/base";
import { theme } from "./theme";
import type { VideoPlan } from "./types";
import demo from "./data/demo-plan.json";

const handle = delayRender("fonts");
fontsReady.then(() => continueRender(handle));

export const Root: React.FC = () => (
  <>
    <Composition
      id="NewsVideo"
      component={NewsVideo}
      fps={theme.fps}
      width={theme.width}
      height={theme.height}
      durationInFrames={300}
      defaultProps={demo as VideoPlan}
      calculateMetadata={({ props }) => {
        const last = props.beats[props.beats.length - 1];
        return { durationInFrames: Math.ceil(((last?.end ?? 10) + 0.6) * theme.fps) };
      }}
    />
    <Still
      id="Thumbnail"
      component={Thumbnail}
      width={1280}
      height={720}
      defaultProps={{ image: "demo/thumb-bg.jpg", line1: "Η ΑΠΑΤΗ", line2: "ΔΕΝ ΕΠΙΑΣΕ" } satisfies ThumbnailProps}
    />
  </>
);
