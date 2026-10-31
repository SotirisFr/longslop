import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import type { Visual } from "../types";
import { Background, Caps, Media, src, useIn } from "../components/base";
import { Icon } from "../components/icons";
import mapData from "../data/greece-map.json";

const c = theme.color;
type Of<T extends Visual["type"]> = Extract<Visual, { type: T }>;

export const ChapterCard: React.FC<Of<"chapter">> = ({ title, subtitle }) => {
  const p = useIn(0, 12);
  return (
    <Background red>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", padding: 120 }}>
        <Caps style={{ fontSize: 150, fontWeight: 900, transform: `scale(${interpolate(p, [0, 1], [1.15, 1])})`, opacity: p }}>{title}</Caps>
        {subtitle && <Caps style={{ fontSize: 56, color: "#1d1b1a", marginTop: 20, opacity: p }}>{subtitle}</Caps>}
      </AbsoluteFill>
    </Background>
  );
};

// "100.000.000 €" counts up digit groups; non-numeric values just pop in.
const countUp = (value: string, t: number) => {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return value;
  const n = Math.round(Number(digits) * Math.min(1, t));
  let s = String(n).padStart(digits.length, "0");
  let i = 0;
  return value.replace(/\d/g, () => s[i++]);
};

export const BigNumber: React.FC<Of<"bigNumber">> = ({ value, caption, countUp: cu = true, background }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = useIn(0);
  const t = interpolate(frame, [0, fps * 1.2], [0, 1], { extrapolateRight: "clamp" });
  const shown = cu && !/[–-]/.test(value) ? countUp(value, 1 - Math.pow(1 - t, 3)) : value;
  return (
    <Background>
      {background && <Media file={background} dim={0.6} />}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: 230, fontWeight: 900, color: c.yellow, transform: `scale(${interpolate(p, [0, 1], [0.85, 1])})`, fontVariantNumeric: "tabular-nums" }}>
          {shown}
        </div>
        {caption && <Caps style={{ fontSize: 40, fontWeight: 600, letterSpacing: "0.08em", color: c.yellow, opacity: p, marginTop: 8 }}>{caption}</Caps>}
      </AbsoluteFill>
    </Background>
  );
};

export const Statement: React.FC<Of<"statement">> = ({ lines, note, red }) => {
  return (
    <Background red={red}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", padding: 140 }}>
        {lines.map((l, i) => (
          <StatementLine key={i} delay={i * 8} text={l.text} color={l.color} first={i === 0} />
        ))}
        {note && <Caps style={{ fontSize: 26, fontWeight: 500, letterSpacing: "0.14em", color: c.grey, marginTop: 34 }}>{note}</Caps>}
      </AbsoluteFill>
    </Background>
  );
};
const StatementLine: React.FC<{ text: string; color?: string; delay: number; first: boolean }> = ({ text, color, delay, first }) => {
  const p = useIn(delay);
  const col = color === "yellow" ? c.yellow : color === "red" ? c.red : c.white;
  return (
    <Caps style={{ fontSize: first ? 96 : 76, fontWeight: 900, color: col, opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>{text}</Caps>
  );
};

export const PaperCard: React.FC<Of<"paperCard">> = ({ title, lines, questions, field, badge }) => {
  const frame = useCurrentFrame();
  const p = useIn(0);
  const items = questions ?? lines ?? [];
  return (
    <Background>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: 900,
            minHeight: 520,
            background: c.cream,
            color: c.creamInk,
            padding: "48px 56px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
            transform: `rotate(${interpolate(p, [0, 1], [-6, -1.5])}deg) translateY(${(1 - p) * 120}px)`,
            opacity: p,
            position: "relative",
          }}
        >
          <Caps style={{ fontSize: 40, fontWeight: 900, marginBottom: 30 }}>{title}</Caps>
          {items.map((q, i) => {
            const o = interpolate(frame, [12 + i * 10, 20 + i * 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 34, fontWeight: 600, textTransform: "uppercase", margin: "14px 0", opacity: o }}>
                <span>{q}</span>
                {questions && <span style={{ color: c.red, fontWeight: 900 }}>?</span>}
              </div>
            );
          })}
          {!items.length &&
            [0, 1, 2, 3].map((i) => <div key={i} style={{ height: 10, background: "#b8b1a6", margin: "26px 0", width: i === 3 ? "50%" : "100%" }} />)}
          {field && (
            <div style={{ marginTop: 40 }}>
              <div style={{ fontSize: 18, letterSpacing: "0.12em", color: c.greyDark, textTransform: "uppercase" }}>{field.label}</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: "#1f3c8a", borderBottom: "2px solid #8a847c", paddingBottom: 6, minHeight: 44 }}>{field.value ?? ""}</div>
            </div>
          )}
          {badge && (
            <div style={{ position: "absolute", top: -30, right: -150, background: c.yellow, color: c.creamInk, fontWeight: 900, fontSize: 40, padding: "10px 24px", transform: "rotate(-5deg)" }}>
              {badge}
            </div>
          )}
        </div>
      </AbsoluteFill>
    </Background>
  );
};

export const BulletCards: React.FC<Of<"bulletCards">> = ({ items, photo, grade = "bw" }) => {
  const frame = useCurrentFrame();
  return (
    <Background>
      {photo && <Media file={photo} grade={grade} dim={0.35} />}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-end", paddingRight: 140, gap: 26 }}>
        {items.map((t, i) => {
          const o = interpolate(frame, [i * 14, i * 14 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div
              key={i}
              style={{
                width: 760,
                background: c.cream,
                color: c.creamInk,
                borderRadius: 14,
                padding: "26px 30px",
                fontSize: 40,
                fontWeight: 800,
                textTransform: "uppercase",
                display: "flex",
                gap: 16,
                alignItems: "center",
                opacity: o,
                transform: `translateX(${(1 - o) * 60}px)`,
                boxShadow: "0 16px 30px rgba(0,0,0,0.4)",
              }}
            >
              <span style={{ color: c.red, fontWeight: 900, fontSize: 46 }}>«</span>
              {t}
            </div>
          );
        })}
      </AbsoluteFill>
    </Background>
  );
};

export const Timeline: React.FC<Of<"timeline">> = ({ from, to, tag, chips = [] }) => {
  const frame = useCurrentFrame();
  const years = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const x0 = 260;
  const x1 = 1660;
  const xOf = (y: number) => x0 + ((y - from) / Math.max(1, to - from)) * (x1 - x0);
  const draw = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <Background>
      <svg width="1920" height="1080" style={{ position: "absolute" }}>
        <line x1={x0} y1={700} x2={x0 + (x1 - x0) * draw} y2={700} stroke={c.grey} strokeWidth={3} />
        {years.map((y) => (
          <g key={y} opacity={draw}>
            <line x1={xOf(y)} y1={688} x2={xOf(y)} y2={712} stroke={c.grey} strokeWidth={3} />
            <text x={xOf(y)} y={752} textAnchor="middle" fill={c.grey} fontFamily="Inter" fontWeight={600} fontSize={32}>
              {y}
            </text>
          </g>
        ))}
      </svg>
      {chips.map((ch, i) => {
        const o = interpolate(frame, [12 + i * 6, 18 + i * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const bg = ch.color === "green" ? c.green : ch.color === "red" ? c.red : "#5b5653";
        return (
          <div key={i} style={{ position: "absolute", left: xOf(ch.year) - 90, top: 600 - (i % 2) * 64, width: 180, textAlign: "center", opacity: o }}>
            <span style={{ background: bg, padding: "8px 14px", borderRadius: 6, fontSize: 30, fontWeight: 800 }}>{ch.label}</span>
          </div>
        );
      })}
      {tag && (
        <div
          style={{
            position: "absolute",
            left: xOf(tag.year) - 110,
            top: 600,
            width: 220,
            textAlign: "center",
            opacity: interpolate(frame, [16, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ background: c.yellow, color: c.creamInk, padding: "14px 24px", borderRadius: 10, fontSize: 30, fontWeight: 900, textTransform: "uppercase" }}>
            {tag.label}
          </span>
        </div>
      )}
    </Background>
  );
};

export const BarChart: React.FC<Of<"barChart">> = ({ labels, series }) => {
  const frame = useCurrentFrame();
  const totals = labels.map((_, i) => series.reduce((s, se) => s + (se.values[i] ?? 0), 0));
  const max = Math.max(...totals, 1);
  const col = { red: c.red, yellow: c.yellow, white: c.cream };
  const bw = 90;
  const gap = (1300 - labels.length * bw) / Math.max(1, labels.length - 1);
  return (
    <Background>
      <div style={{ position: "absolute", top: 150, left: 310, display: "flex", gap: 40, fontSize: 30, fontWeight: 700 }}>
        {series.map((s) => (
          <span key={s.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 24, height: 24, background: col[s.color] }} />
            {s.name}
          </span>
        ))}
      </div>
      <svg width="1920" height="1080" style={{ position: "absolute" }}>
        <line x1={300} y1={880} x2={1620} y2={880} stroke={c.greyDark} strokeWidth={2} />
        {labels.map((l, i) => {
          const grow = interpolate(frame, [i * 4, i * 4 + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          let y = 880;
          const x = 310 + i * (bw + gap);
          return (
            <g key={l}>
              {series.map((s) => {
                const h = ((s.values[i] ?? 0) / max) * 580 * grow;
                y -= h;
                return <rect key={s.name} x={x} y={y} width={bw} height={h} fill={col[s.color]} />;
              })}
              <text x={x + bw / 2} y={918} textAnchor="middle" fill={c.grey} fontFamily="Inter" fontSize={22} fontWeight={600}>
                {l}
              </text>
            </g>
          );
        })}
      </svg>
    </Background>
  );
};

const project = (lon: number, lat: number) => {
  const [L0, B0, L1, B1] = mapData.bounds;
  const k = Math.cos((38.3 * Math.PI) / 180);
  const W = mapData.width;
  const H = (W * (B1 - B0)) / ((L1 - L0) * k);
  return [((lon - L0) / (L1 - L0)) * W, ((B1 - lat) / (B1 - B0)) * H];
};

export const MapScene: React.FC<Of<"map">> = ({ pins, route, tag, background }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.06]);
  const pts = pins.map((p) => project(p.lon, p.lat));
  const routeP = interpolate(frame, [10, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let arc = "";
  if (route) {
    const [a, b] = [pts[route[0]], pts[route[1]]];
    const mx = (a[0] + b[0]) / 2;
    const my = Math.min(a[1], b[1]) - Math.abs(a[0] - b[0]) * 0.35 - 30;
    arc = `M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`;
  }
  const W = mapData.width;
  const H = mapData.height;
  return (
    <Background>
      {background ? <Media file={background} dim={0.45} /> : <AbsoluteFill style={{ backgroundColor: c.mapSea }} />}
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="1920" height="1080" preserveAspectRatio="xMidYMid meet">
          
          {!background &&
            Object.entries(mapData.countries).map(([iso, d]) => (
              <path key={iso} d={d as string} fill={iso === "GRC" ? c.mapLand : c.mapOther} stroke="#151312" strokeWidth={0.8} />
            ))}
          {route && (
            <path d={arc} fill="none" stroke={c.yellow} strokeWidth={3} strokeDasharray="8 8" opacity={routeP} />
          )}
          {pts.map(([x, y], i) => {
            const s = interpolate(frame, [4 + i * 8, 12 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <g key={i} opacity={s}>
                <circle cx={x} cy={y} r={14 * s} fill={c.red} opacity={0.3} />
                <circle cx={x} cy={y} r={7} fill={c.red} stroke={c.white} strokeWidth={2} />
                <text x={x} y={y + 34} textAnchor="middle" fill={c.white} fontFamily="Inter" fontWeight={900} fontSize={22} style={{ textTransform: "uppercase" }}>
                  {pins[i].label.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>
      {tag && (
        <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center" }}>
          <span style={{ background: c.cream, color: c.creamInk, padding: "10px 22px", borderRadius: 8, fontSize: 30, fontWeight: 900, textTransform: "uppercase" }}>
            {tag}
          </span>
        </div>
      )}
    </Background>
  );
};

export const People: React.FC<Of<"people">> = ({ people }) => {
  const frame = useCurrentFrame();
  return (
    <Background>
      <AbsoluteFill style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 220 }}>
        {people.map((p, i) => {
          const o = interpolate(frame, [i * 8, i * 8 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: o, transform: `translateY(${(1 - o) * 40}px)` }}>
              <div style={{ position: "relative" }}>
                <Icon name="person" size={300} />
                {p.unknown && (
                  <div style={{ position: "absolute", top: 18, left: 0, right: 0, textAlign: "center", fontSize: 70, fontWeight: 900, color: c.creamInk }}>?</div>
                )}
              </div>
              <div style={{ marginTop: 18, background: c.cream, color: c.creamInk, padding: "8px 18px", fontSize: 30, fontWeight: 900, textTransform: "uppercase", borderRadius: 4 }}>
                {p.label}
              </div>
              {p.sublabel && <Caps style={{ fontSize: 20, fontWeight: 500, letterSpacing: "0.12em", color: c.grey, marginTop: 10 }}>{p.sublabel}</Caps>}
            </div>
          );
        })}
      </AbsoluteFill>
    </Background>
  );
};

export const CompanySwap: React.FC<Of<"companySwap">> = ({ from, to, debts = 3, label }) => {
  const frame = useCurrentFrame();
  const shop = interpolate(frame, [18, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ax = 560;
  const bx = 1360;
  const sx = ax + (bx - ax) * shop;
  const sy = 400 - Math.sin(shop * Math.PI) * 160;
  const box = (x: number, name: string, color: string) => (
    <div style={{ position: "absolute", left: x - 170, top: 520, width: 340, height: 170, background: color, borderRadius: 8, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 22 }}>
      <Caps style={{ fontSize: 36, fontWeight: 900 }}>{name}</Caps>
    </div>
  );
  return (
    <Background>
      {box(ax, from, "#55504c")}
      {box(bx, to, c.green)}
      <div style={{ position: "absolute", left: ax - 150, top: 540, display: "flex", gap: 8 }}>
        {Array.from({ length: debts }).map((_, i) => (
          <span key={i} style={{ background: c.red, fontSize: 18, fontWeight: 900, padding: "4px 10px", borderRadius: 4, transform: `rotate(${(i - 1) * 5}deg)` }}>
            ΧΡΕΟΣ
          </span>
        ))}
      </div>
      <div style={{ position: "absolute", left: sx - 70, top: sy - 60 }}>
        <Icon name="shop" size={140} />
      </div>
      {label && (
        <div style={{ position: "absolute", top: 200, width: "100%", textAlign: "center", opacity: shop }}>
          <span style={{ border: `5px solid ${c.yellow}`, color: c.yellow, padding: "10px 26px", fontSize: 44, fontWeight: 900, textTransform: "uppercase", display: "inline-block", transform: "rotate(4deg)" }}>
            {label}
          </span>
        </div>
      )}
    </Background>
  );
};

export const PhotoFrame: React.FC<Of<"photoFrame">> = ({ src: file, caption, tag }) => {
  const p = useIn(0);
  return (
    <Background>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            background: "#fff",
            padding: "18px 18px 70px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
            transform: `rotate(${interpolate(p, [0, 1], [-10, -3])}deg) scale(${interpolate(p, [0, 1], [0.8, 1])})`,
            opacity: p,
            position: "relative",
          }}
        >
          <Img src={src(file)} style={{ width: 820, height: 520, objectFit: "cover", display: "block" }} />
          {caption && <div style={{ position: "absolute", left: 24, bottom: 18, color: "#1d1b1a", fontWeight: 900, fontSize: 30, textTransform: "uppercase" }}>{caption}</div>}
          {tag && <div style={{ position: "absolute", right: 24, bottom: 22, color: c.red, fontWeight: 800, fontSize: 20, textTransform: "uppercase" }}>{tag}</div>}
        </div>
      </AbsoluteFill>
    </Background>
  );
};

export const Footage: React.FC<Of<"footage">> = ({ src: file, kind, grade, startFrom }) => <Media file={file} kind={kind} grade={grade} startFrom={startFrom} />;

export const SubjectCard: React.FC<Of<"subjectCard">> = ({ photo, logo, background, grade = "color" }) => (
  <Background>
    {background && <Media file={background} grade={grade} dim={0.35} />}
    <AbsoluteFill style={{ filter: grade === "bw" ? "grayscale(1)" : undefined }}>
      <Img src={src(photo)} style={{ position: "absolute", left: 0, bottom: 0, height: "100%", width: "58%", objectFit: "cover", maskImage: "linear-gradient(90deg, #000 70%, transparent)" }} />
      {logo && <Img src={src(logo)} style={{ position: "absolute", right: 120, top: 220, width: 620, objectFit: "contain" }} />}
    </AbsoluteFill>
  </Background>
);

export const IconScene: React.FC<Of<"icon">> = ({ icon, label, tag }) => {
  const p = useIn(0);
  return (
    <Background>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ transform: `scale(${interpolate(p, [0, 1], [0.7, 1])})`, opacity: p }}>
          <Icon name={icon} size={420} />
        </div>
        {label && <Caps style={{ marginTop: 30, fontSize: 44, fontWeight: 900 }}>{label}</Caps>}
        {tag && (
          <div style={{ marginTop: 20, background: c.red, padding: "8px 18px", fontSize: 26, fontWeight: 900, textTransform: "uppercase", borderRadius: 4 }}>{tag}</div>
        )}
      </AbsoluteFill>
    </Background>
  );
};

export const renderVisual = (v: Visual) => {
  switch (v.type) {
    case "chapter":
      return <ChapterCard {...v} />;
    case "bigNumber":
      return <BigNumber {...v} />;
    case "statement":
      return <Statement {...v} />;
    case "paperCard":
      return <PaperCard {...v} />;
    case "bulletCards":
      return <BulletCards {...v} />;
    case "timeline":
      return <Timeline {...v} />;
    case "barChart":
      return <BarChart {...v} />;
    case "map":
      return <MapScene {...v} />;
    case "people":
      return <People {...v} />;
    case "companySwap":
      return <CompanySwap {...v} />;
    case "photoFrame":
      return <PhotoFrame {...v} />;
    case "footage":
      return <Footage {...v} />;
    case "subjectCard":
      return <SubjectCard {...v} />;
    case "icon":
      return <IconScene {...v} />;
  }
};
