"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
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
  { href: "#mezcladora", label: "Mezcladora" },
  { href: "#por-que", label: "Por qué" },
];

export function Nav({ variante, address, onSalir }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-40 px-3 pt-3"
    >
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between rounded-full border py-2 pr-2 pl-5 backdrop-blur-xl transition-all duration-500"
        style={{
          borderColor: scrolled ? "var(--line-strong)" : "var(--line)",
          background: scrolled ? "rgba(3,16,15,0.78)" : "rgba(255,255,255,0.04)",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Equalizer className="!h-5 !gap-[3px]" />
          <span className="font-display text-[17px] font-bold">Track Split</span>
        </Link>

        {variante === "landing" && (
          <ul className="hidden items-center gap-8 text-sm text-[var(--muted)] md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="transition-colors hover:text-[var(--mint)]">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        {variante === "landing" ? (
          <Link href="/estudio" className="btn btn-primary !rounded-full !px-5 !py-2.5">
            Entrar al estudio <ArrowUpRight size={16} />
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/" className="btn !px-4 !py-2 text-sm text-[var(--muted)] hover:text-[var(--text)]">
              Inicio
            </Link>
            {address && (
              <button type="button" onClick={onSalir} className="btn btn-ghost !rounded-full !px-4 !py-2 text-xs">
                <span className="font-mono">{corto(address)}</span>
                <LogOut size={14} />
              </button>
            )}
          </div>
        )}
      </nav>
    </motion.header>
  );
}
