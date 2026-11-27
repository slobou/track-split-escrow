"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { ArrowUpRight, LogOut } from "lucide-react";
import { Equalizer } from "./Waveform";

const corto = (a: string) => `${a.slice(0, 5)}…${a.slice(-4)}`;

type Props = {
  variante: "landing" | "estudio";
  address?: string | null;
  onSalir?: () => void;
};

const LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#por-que", label: "Por qué" },
];

const DURACION = 3 * 60;

function timecode(p: number) {
  const s = Math.round(p * DURACION);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function Nav({ variante, address, onSalir }: Props) {
  const { scrollYProgress } = useScroll();
  const progreso = useSpring(scrollYProgress, { stiffness: 140, damping: 26 });
  const [tc, setTc] = useState("00:00");
  const [solido, setSolido] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (v) => setTc(timecode(Math.min(Math.max(v, 0), 1))));
  useEffect(() => {
    const f = () => setSolido(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-x-0 top-0 z-40 border-b backdrop-blur-xl transition-colors duration-300"
      style={{
        borderColor: "var(--line)",
        background: solido ? "rgba(3,16,15,0.82)" : "rgba(3,16,15,0.25)",
      }}
    >
      <nav className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto] items-center gap-6 px-5 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="flex items-center gap-3 justify-self-start">
          <Equalizer className="!h-5 !gap-[3px]" />
          <span className="font-display text-[17px] font-bold whitespace-nowrap">Track Split</span>
        </Link>

        {variante === "landing" ? (
          <ul className="hidden items-center gap-9 text-sm text-[var(--muted)] md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="transition-colors hover:text-[var(--text)]">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <span className="hidden font-mono text-xs tracking-widest text-[var(--muted)] uppercase md:block">Estudio · Testnet</span>
        )}

        <div className="flex items-center gap-4 justify-self-end">
          <span className="hidden font-mono text-xs text-[var(--muted)] tabular-nums lg:block">
            <span className="text-[var(--mint)]">{tc}</span> / 03:00
          </span>

          {variante === "landing" ? (
            <Link href="/estudio" className="btn btn-primary !rounded-lg !px-4 !py-2.5">
              Entrar al estudio <ArrowUpRight size={16} />
            </Link>
          ) : (
            <>
              <Link href="/" className="btn !px-3 !py-2 text-sm text-[var(--muted)] hover:text-[var(--text)]">
                Inicio
              </Link>
              {address && (
                <button type="button" onClick={onSalir} className="btn btn-ghost !rounded-lg !px-3.5 !py-2 text-xs">
                  <span className="font-mono">{corto(address)}</span>
                  <LogOut size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      <motion.div
        className="bg-grad absolute inset-x-0 bottom-[-1px] h-[2px] origin-left"
        style={{ scaleX: progreso }}
      />
    </motion.header>
  );
}
