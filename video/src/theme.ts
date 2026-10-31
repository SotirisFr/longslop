// Design system copied from the reference channel: charcoal vignette, cream paper,
// red accents, yellow highlights, one heavy sans with Greek glyphs.
export const theme = {
  fps: 30,
  width: 1920,
  height: 1080,
  font: "Inter",
  color: {
    bgInner: "#3a3634",
    bgOuter: "#141211",
    cream: "#efe9df",
    creamInk: "#1d1b1a",
    red: "#d3202e",
    redDark: "#8f0f19",
    yellow: "#f6b91a",
    green: "#2f9e52",
    grey: "#c9c4be",
    greyDark: "#6f6a66",
    white: "#ffffff",
    mapLand: "#9c8f84",
    mapOther: "#45403c",
    mapSea: "#1e2224",
  },
};

export type Theme = typeof theme;
