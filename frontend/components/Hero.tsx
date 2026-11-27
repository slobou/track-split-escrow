"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ArrowDown, ArrowUpRight, Disc3, Headphones, Mic2, SlidersVertical } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const PALABRAS = ["Nadie", "cobra", "el", "track", "hasta", "que", "TOGGLE", "todos", "firmen."];

const TILES = [
  { icon: Disc3, x: "7%", y: "17%", depth: 28, rot: -10, hue: "from-[#3df5b0] to-[#18d4c8]" },
  { icon: Mic2, x: "85%", y: "15%", depth: -22, rot: 9, hue: "from-[#18d4c8] to-[#2ea8ff]" },
  { icon: SlidersVertical, x: "10%", y: "58%", depth: -34, rot: 7, hue: "from-[#2ea8ff] to-[#3b6bff]" },
  { icon: Headphones, x: "83%", y: "60%", depth: 30, rot: -8, hue: "from-[#3df5b0] to-[#2ea8ff]" },
];

function Tile({ t, mx, my, i }: { t: (typeof TILES)[number]; mx: ReturnType<typeof useSpring>; my: ReturnType<typeof useSpring>; i: number }) {
  const x = useTransform(mx, (v) => v * t.depth);
  const y = useTransform(my, (v) => v * t.depth);
  return (
    <motion.div
      className="absolute hidden md:block"
      style={{ left: t.x, top: t.y, x, y }}
      initial={{ opacity: 0, scale: 0.4, rotate: t.rot * 3 }}
      animate={{ opacity: 1, scale: 1, rotate: t.rot }}
      transition={{ delay: 0.7 + i * 0.12, type: "spring", stiffness: 140, damping: 14 }}
    >
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
        className={`glossy grid h-[84px] w-[84px] place-items-center rounded-[26px] bg-gradient-to-br ${t.hue} text-[#02110e]`}
      >
        <t.icon size={38} strokeWidth={1.8} />
      </motion.div>
      <div className="mx-auto mt-4 h-3 w-16 rounded-full bg-[radial-gradient(closest-side,rgba(24,212,200,0.35),transparent)]" />
    </motion.div>
  );
}

function Interruptor() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setOn((v) => !v), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span
      className="relative mx-1 inline-flex h-[0.8em] w-[1.6em] translate-y-[0.06em] items-center rounded-full p-[0.07em] transition-colors duration-500"
      style={{ background: on ? "linear-gradient(110deg,#3df5b0,#2ea8ff)" : "rgba(255,255,255,0.14)" }}
    >
      <motion.span
        animate={{ x: on ? "0.8em" : "0em" }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className="block h-[0.66em] w-[0.66em] rounded-full bg-white shadow-md"
      />
    </span>
  );
}

export function Hero() {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18 });

  return (
    <section
      className="relative flex min-h-[100svh] flex-col items-center overflow-hidden px-5 pt-36 text-center sm:pt-44"
      onMouseMove={(e) => {
        rawX.set(e.clientX / window.innerWidth - 0.5);
        rawY.set(e.clientY / window.innerHeight - 0.5);
      }}
    >
      {TILES.map((t, i) => (
        <Tile key={i} t={t} mx={mx} my={my} i={i} />
      ))}

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6 }}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-white/[0.04] py-1.5 pr-4 pl-1.5 text-[13px] text-[var(--muted)]"
      >
        <span className="bg-grad rounded-full px-2.5 py-0.5 text-[11px] font-bold text-[#02110e]">Nuevo</span>
        Escrow multifirma en Stellar
      </motion.p>

      <h1 className="font-display mt-8 flex max-w-4xl flex-wrap items-center justify-center gap-x-[0.25em] text-[clamp(2.6rem,7vw,5.6rem)] leading-[1.02] font-extrabold">
        {PALABRAS.map((p, i) =>
          p === "TOGGLE" ? (
            <motion.span key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.07 }}>
              <Interruptor />
            </motion.span>
          ) : (
            <span key={i} className="inline-block overflow-hidden pb-[0.1em]">
              <motion.span
                className={`inline-block ${p === "firmen." ? "text-grad" : ""}`}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.25 + i * 0.07, duration: 0.8, ease: EASE }}
              >
                {p}
              </motion.span>
            </span>
          ),
        )}
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.7 }}
        className="mt-8 max-w-xl text-lg leading-relaxed text-[var(--muted)]"
      >
        El pagador bloquea el pago de la sesión. Productor y artistas aprueban desde su wallet. Al
        llegar al umbral, se libera.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15, duration: 0.7 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-3"
      >
        <Link href="/estudio" className="btn btn-primary !rounded-full !px-7 !py-3.5">
          Entrar al estudio <ArrowUpRight size={17} />
        </Link>
        <a href="#como-funciona" className="btn btn-ghost !rounded-full !px-6 !py-3.5">
          Cómo funciona <ArrowDown size={16} />
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-8 flex flex-col items-center gap-2 font-mono text-[11px] tracking-widest text-[var(--muted)] uppercase"
      >
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
          <ArrowDown size={14} />
        </motion.span>
        Scroll
      </motion.div>
    </section>
  );
}
