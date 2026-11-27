"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useCancion } from "@/lib/canciones";

const C = 250;
const R = 196;

function arco(a0: number, a1: number, r = R) {
  const rad = (a: number) => ((a - 90) * Math.PI) / 180;
  const p = (a: number) => [C + r * Math.cos(rad(a)), C + r * Math.sin(rad(a))];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

const FIRMANTES = [
  { nombre: "Productor", a0: 8, a1: 112, color: "#3df5b0" },
  { nombre: "Voz principal", a0: 128, a1: 232, color: "#18d4c8" },
  { nombre: "Guitarra", a0: 248, a1: 352, color: "#2ea8ff" },
];

const MAX_ETIQUETA = 18;

function etiqueta(nombre: string) {
  const n = nombre.toUpperCase();
  return n.length > MAX_ETIQUETA ? `${n.slice(0, MAX_ETIQUETA - 1).trimEnd()}…` : n;
}

const ESTADOS = ["Fondos bloqueados", "1 de 2 firmas", "2 de 2 firmas", "Pago liberado"];

/** Disco de vinilo cuyo anillo se ilumina a medida que los firmantes aprueban. */
export function Vinyl() {
  const [paso, setPaso] = useState(0);
  const [cancion, nuevaCancion] = useCancion();

  useEffect(() => {
    const t = setInterval(() => setPaso((p) => (p + 1) % 5), 1700);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (paso === 4) nuevaCancion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso]);

  const firmas = paso === 4 ? 0 : Math.min(paso, 2);
  const liberado = paso === 3;
  const estado = ESTADOS[paso === 4 ? 0 : paso];
  const encendido = [firmas >= 1 || liberado, firmas >= 2 || liberado, false];

  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(24,212,200,0.22),transparent_68%)] blur-2xl" />

      <svg viewBox="0 0 500 500" className="relative w-full" role="img" aria-label="Disco de vinilo que se ilumina con cada firma">
        <defs>
          <linearGradient id="label" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3df5b0" />
            <stop offset="0.55" stopColor="#18d4c8" />
            <stop offset="1" stopColor="#3b6bff" />
          </linearGradient>
          <radialGradient id="disc" cx="0.35" cy="0.3" r="0.9">
            <stop offset="0" stopColor="#14302d" />
            <stop offset="1" stopColor="#040d0d" />
          </radialGradient>
        </defs>

        <circle cx={C} cy={C} r={236} fill="url(#disc)" stroke="rgba(160,255,230,0.18)" />

        <g className="vinyl-spin" style={{ transformOrigin: "250px 250px" }}>
          {[222, 212, 178, 168, 158, 148, 138, 128, 118].map((r) => (
            <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="rgba(160,255,230,0.07)" strokeWidth="1" />
          ))}
          <path d="M 250 20 A 230 230 0 0 1 440 120" stroke="rgba(255,255,255,0.12)" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M 250 480 A 230 230 0 0 1 60 380" stroke="rgba(255,255,255,0.07)" strokeWidth="14" strokeLinecap="round" fill="none" />
        </g>

        {FIRMANTES.map((f, i) => (
          <g key={f.nombre}>
            <path d={arco(f.a0, f.a1)} stroke="rgba(160,255,230,0.13)" strokeWidth="10" strokeLinecap="round" fill="none" />
            <motion.path
              d={arco(f.a0, f.a1)}
              stroke={f.color}
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              initial={false}
              animate={{ pathLength: encendido[i] ? 1 : 0, opacity: encendido[i] ? 1 : 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </g>
        ))}

        <motion.circle
          cx={C}
          cy={C}
          r={92}
          fill="url(#label)"
          animate={{ scale: liberado ? [1, 1.07, 1] : 1 }}
          transition={{ duration: 0.7 }}
          style={{ transformOrigin: "250px 250px" }}
        />
        <circle cx={C} cy={C} r={92} fill="none" stroke="rgba(255,255,255,0.35)" />
        <circle cx={C} cy={C} r={8} fill="#04100f" />

        <text x={C} y={C - 38} textAnchor="middle" fontSize="10" letterSpacing="1.5" fill="#02110e" opacity="0.7" style={{ fontFamily: "var(--font-mono)" }}>
          {etiqueta(cancion)}
        </text>
        <text x={C} y={C + 44} textAnchor="middle" fontSize="30" fontWeight="800" fill="#02110e" style={{ fontFamily: "var(--font-display)" }}>
          1.500 XLM
        </text>
      </svg>

      <div className="relative mt-6 flex items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-black/30 px-4 py-3">
        <div className="flex gap-4">
          {FIRMANTES.map((f, i) => (
            <span key={f.nombre} className="flex items-center gap-2 text-xs font-semibold">
              <motion.span
                className="h-2.5 w-2.5 rounded-full"
                animate={{ backgroundColor: encendido[i] ? f.color : "rgba(160,255,230,0.2)", scale: encendido[i] ? 1.25 : 1 }}
              />
              <span className="hidden sm:inline">{f.nombre}</span>
            </span>
          ))}
        </div>
        <motion.span
          key={estado}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-xs"
          style={{ color: liberado ? "var(--sky)" : "var(--mint)" }}
        >
          {estado}
        </motion.span>
      </div>
    </div>
  );
}
