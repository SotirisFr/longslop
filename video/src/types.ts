// The beat plan: one beat per sentence of narration, produced by the beat-planner
// step and timed from the voiceover's word timestamps (seconds).

export type Visual =
  | { type: "chapter"; title: string; subtitle?: string }
  | {
      type: "bigNumber";
      value: string; // "59", "100.000.000 €", "500 – 700 €"
      caption?: string;
      countUp?: boolean; // animate digits from 0 when value is numeric
      background?: string; // optional dimmed footage/photo behind the number
    }
  | { type: "statement"; lines: { text: string; color?: "white" | "yellow" | "red" }[]; note?: string; red?: boolean }
  | { type: "paperCard"; title: string; lines?: string[]; questions?: string[]; field?: { label: string; value?: string }; badge?: string }
  | { type: "bulletCards"; items: string[]; photo?: string; grade?: "color" | "bw" }
  | {
      type: "timeline";
      from: number;
      to: number;
      tag?: { label: string; year: number };
      chips?: { label: string; year: number; color?: "grey" | "green" | "red" }[];
    }
  | { type: "barChart"; labels: string[]; series: { name: string; color: "red" | "yellow" | "white"; values: number[] }[] }
  | {
      type: "map";
      pins: { label: string; lon: number; lat: number }[];
      route?: [number, number]; // indexes into pins, drawn as a dotted arc
      tag?: string; // e.g. "ΜΙΑ ΕΒΔΟΜΑΔΑ ΠΡΙΝ"
      background?: string; // optional aerial footage instead of the flat map
    }
  | { type: "people"; people: { label: string; sublabel?: string; unknown?: boolean }[] }
  | { type: "companySwap"; from: string; to: string; debts?: number; label?: string }
  | { type: "photoFrame"; src: string; caption?: string; tag?: string }
  | { type: "footage"; src: string; kind?: "video" | "image"; grade?: "color" | "bw"; startFrom?: number }
  | { type: "subjectCard"; photo: string; logo?: string; background?: string; grade?: "color" | "bw" }
  | { type: "icon"; icon: IconName; label?: string; tag?: string };

export type IconName = "shop" | "passport" | "scales" | "magnifier" | "phoneOff" | "document" | "person" | "border";

export type Beat = {
  id: string;
  start: number;
  end: number;
  text?: string; // the narration sentence, kept for debugging and captions
  visual: Visual;
  kicker?: string; // small red-dot source line at the top ("ΣΥΜΦΩΝΑ ΜΕ ΤΙΣ ΑΡΧΕΣ")
  stamp?: { text: string; color?: "red" | "yellow"; at?: number }; // at = seconds into the beat
  lowerThird?: { title: string; subtitle?: string };
  credit?: string; // "ΦΩΤΟ: PROTOTHEMA.GR"
};

export type VideoPlan = {
  title: string;
  voice?: string; // file in public/, or URL
  music?: string;
  musicVolume?: number; // 0..1, default 0.12 (≈ -18 dB, sits ~10 dB under the voice)
  sfx?: { chapter?: string; stamp?: string };
  beats: Beat[];
};
