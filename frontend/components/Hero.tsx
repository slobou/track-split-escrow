"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Vinyl } from "./Vinyl";

const EASE = [0.22, 1, 0.36, 1] as const;

const LINEAS = ["El track se cobra", "cuando todos", "firman."];

export function Hero() {
  return (
    <section className="grid min-h-[100svh] items-center gap-14 pt-32 pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
      <div>
        <motion.p
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="font-mono text-xs tracking-[0.22em] text-[var(--mint)] uppercase"
        >
          ▍ Escrow multifirma · Stellar
        </motion.p>

        <h1 className="font-display mt-6 text-[clamp(2.5rem,5.2vw,4.9rem)] leading-[0.98] font-extrabold">
          {LINEAS.map((l, i) => (
            <span key={l} className="block overflow-hidden pb-[0.08em]">
              <motion.span
                className={`block whitespace-nowrap ${i === 2 ? "text-grad" : ""}`}
                initial={{ y: "105%", rotate: 2 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ delay: 0.25 + i * 0.14, duration: 0.9, ease: EASE }}
              >
                {l}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.7 }}
          className="mt-8 max-w-md text-lg leading-relaxed text-[var(--muted)]"
        >
          El pagador bloquea el pago de la sesión. Productor y artistas aprueban desde su wallet.
          Al llegar al umbral, se libera.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.7 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <Link href="/estudio" className="btn btn-primary !rounded-lg !px-6 !py-3.5">
            Entrar al estudio <ArrowUpRight size={17} />
          </Link>
          <a href="#como-funciona" className="btn btn-ghost !rounded-lg !px-5 !py-3.5">
            Cómo funciona <ArrowDown size={16} />
          </a>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-14 flex flex-wrap gap-x-10 gap-y-3 font-mono text-xs text-[var(--muted)]"
        >
          {[
            ["Red", "Stellar Testnet"],
            ["Contrato", "Soroban"],
            ["Firmas", "2 de 3"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="tracking-widest uppercase">{k}</dt>
              <dd className="mt-1 text-[var(--text)]">{v}</dd>
            </div>
          ))}
        </motion.dl>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, duration: 1.1, ease: EASE }}
      >
        <Vinyl />
      </motion.div>
    </section>
  );
}
