"use client";

import { motion } from "motion/react";

function alturas(seed: number, n: number) {
  let s = seed * 9301 + 49297;
  return Array.from({ length: n }, (_, i) => {
    s = (s * 9301 + 49297) % 233280;
    const base = s / 233280;
    const envelope = 0.45 + 0.55 * Math.sin((i / n) * Math.PI);
    return 0.18 + base * 0.82 * envelope;
  });
}

type Props = {
  seed: number;
  progreso: number;
  tono?: "activo" | "liberado" | "cancelado";
  barras?: number;
};

/** Forma de onda del track: se "llena" a medida que entran las firmas. */
export function Waveform({ seed, progreso, tono = "activo", barras = 56 }: Props) {
  const hs = alturas(seed, barras);
  const llenas = Math.round(progreso * barras);

  return (
    <div className="flex h-14 items-center gap-[3px]" aria-hidden>
      {hs.map((h, i) => {
        const on = i < llenas;
        const color =
          tono === "cancelado"
            ? "rgba(255,107,129,0.35)"
            : on
              ? `hsl(${160 + (i / barras) * 60} 90% 60%)`
              : "rgba(160,255,230,0.14)";
        return (
          <motion.span
            key={i}
            initial={{ scaleY: 0.1, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1, backgroundColor: color }}
            transition={{ delay: i * 0.012, duration: 0.45, ease: "easeOut" }}
            className="w-[3px] flex-1 rounded-full"
            style={{ height: `${h * 100}%`, minWidth: 2 }}
          />
        );
      })}
    </div>
  );
}

export function Equalizer({ className = "" }: { className?: string }) {
  const hs = [0.5, 0.9, 0.65, 1, 0.55, 0.8, 0.4, 0.95, 0.6];
  return (
    <div className={`flex h-10 items-center gap-1 ${className}`} aria-hidden>
      {hs.map((h, i) => (
        <span
          key={i}
          className="eq w-1 rounded-full bg-grad"
          style={{ height: `${h * 100}%`, animationDelay: `${i * 0.11}s` }}
        />
      ))}
    </div>
  );
}
