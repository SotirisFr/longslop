import React from "react";
import { theme } from "../theme";
import type { IconName } from "../types";

const c = theme.color;

// Flat vector icons in the reference's style: solid fills, no outlines, cream/red/grey.
export const Icon: React.FC<{ name: IconName; size?: number }> = ({ name, size = 360 }) => {
  switch (name) {
    case "shop":
      return (
        <svg width={size} height={size * 0.9} viewBox="0 0 200 180">
          <rect x="10" y="10" width="180" height="160" fill="#1d1b1a" />
          <rect x="18" y="18" width="164" height="22" fill="#1d1b1a" />
          <text x="100" y="35" textAnchor="middle" fontFamily="Inter" fontWeight="900" fontSize="17" fill={c.yellow}>
            ΦΟΥΡΝΟΣ
          </text>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${18 + i * 27.3} 44 h27.3 v18 a13.65 13.65 0 0 1 -27.3 0z`} fill={i % 2 ? c.cream : c.red} />
          ))}
          <rect x="22" y="80" width="100" height="70" fill={c.cream} />
          <rect x="30" y="88" width="84" height="54" fill="#d8b98a" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={48 + i * 24} cy={118} r={6} fill="#a8783e" />
          ))}
          <rect x="132" y="80" width="46" height="90" fill="#3b3634" />
          <circle cx="170" cy="126" r="3" fill={c.grey} />
        </svg>
      );
    case "person":
      return (
        <svg width={size * 0.6} height={size} viewBox="0 0 120 200">
          <circle cx="60" cy="42" r="34" fill={c.cream} />
          <path d="M8 200 V120 a52 52 0 0 1 104 0 V200z" fill={c.cream} />
        </svg>
      );
    case "passport":
      return (
        <svg width={size * 0.75} height={size} viewBox="0 0 150 200">
          <rect x="6" y="6" width="138" height="188" rx="8" fill="#7d1a24" />
          <text x="75" y="44" textAnchor="middle" fontFamily="Inter" fontWeight="800" fontSize="15" fill={c.yellow}>
            ΔΙΑΒΑΤΗΡΙΟ
          </text>
          <circle cx="75" cy="100" r="26" fill="none" stroke={c.yellow} strokeWidth="3" />
          <text x="75" y="168" textAnchor="middle" fontFamily="Inter" fontWeight="600" fontSize="11" fill={c.yellow}>
            PASSPORT
          </text>
        </svg>
      );
    case "scales":
      return (
        <svg width={size} height={size * 0.7} viewBox="0 0 300 210">
          <rect x="146" y="20" width="8" height="170" fill={c.grey} />
          <rect x="40" y="18" width="220" height="6" fill={c.grey} transform="rotate(-4 150 21)" />
          <path d="M60 30 L30 110 H90Z" fill="none" stroke={c.grey} strokeWidth="3" />
          <path d="M240 18 L210 98 H270Z" fill="none" stroke={c.grey} strokeWidth="3" />
          <rect x="110" y="188" width="80" height="10" fill={c.grey} />
        </svg>
      );
    case "magnifier":
      return (
        <svg width={size} height={size} viewBox="0 0 200 200">
          <circle cx="85" cy="85" r="60" fill="rgba(211,32,46,0.25)" stroke={c.yellow} strokeWidth="10" />
          <rect x="128" y="124" width="16" height="70" rx="6" fill={c.yellow} transform="rotate(-45 136 159)" />
        </svg>
      );
    case "phoneOff":
      return (
        <svg width={size * 0.55} height={size} viewBox="0 0 110 200">
          <rect x="8" y="6" width="94" height="188" rx="14" fill="#1d1b1a" stroke={c.grey} strokeWidth="5" />
          <circle cx="55" cy="96" r="20" fill="none" stroke={c.greyDark} strokeWidth="5" />
          <rect x="52" y="68" width="6" height="26" fill={c.greyDark} />
          <line x1="0" y1="200" x2="110" y2="0" stroke={c.red} strokeWidth="7" />
        </svg>
      );
    case "document":
      return (
        <svg width={size * 0.8} height={size} viewBox="0 0 160 200">
          <rect x="6" y="6" width="148" height="188" fill={c.cream} transform="rotate(-2 80 100)" />
          {[40, 62, 84, 106, 128].map((y) => (
            <rect key={y} x="24" y={y} width={y === 128 ? 70 : 112} height="6" fill="#b8b1a6" />
          ))}
        </svg>
      );
    case "border":
      return (
        <svg width={size * 1.6} height={size} viewBox="0 0 320 200">
          <rect x="156" y="20" width="8" height="180" fill={c.grey} />
          {Array.from({ length: 10 }).map((_, i) => (
            <rect key={i} x={i * 32} y="80" width="32" height="14" fill={i % 2 ? c.white : c.red} />
          ))}
        </svg>
      );
  }
};
