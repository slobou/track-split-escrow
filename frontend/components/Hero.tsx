"use client";

import { motion } from "motion/react";
import { LogOut, Wallet, Zap } from "lucide-react";
import { Equalizer } from "./Waveform";

const corto = (a: string) => `${a.slice(0, 5)}…${a.slice(-4)}`;

type Props = {
  address: string | null;
  onConectar: () => void;
  onDemo: () => void;
  onSalir: () => void;
};

const PASOS = ["Crear", "Bloquear", "Firmar", "Liberar"];

export function Hero({ address, onConectar, onDemo, onSalir }: Props) {
  return (
    <header className="relative">
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Equalizer className="!h-7" />
          <span className="font-display text-lg font-bold tracking-tight">Track Split</span>
        </div>
        {address ? (
          <button type="button" onClick={onSalir} className="btn btn-ghost !px-3.5 !py-2 text-xs">
            <span className="font-mono">{corto(address)}</span>
            <LogOut size={14} />
          </button>
        ) : (
          <span className="font-mono text-xs text-[var(--muted)]">Stellar · Testnet</span>
        )}
      </motion.nav>

      <div className="mt-16 sm:mt-24">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="font-mono text-xs tracking-[0.2em] text-[var(--mint)] uppercase"
        >
          Escrow multifirma para música
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          className="font-display mt-5 max-w-3xl text-5xl leading-[0.98] font-extrabold sm:text-7xl"
        >
          Nadie cobra el track hasta que <span className="text-grad">todos firmen.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]"
        >
          El pagador bloquea los fondos de la sesión. Productor y artistas aprueban desde su propia
          wallet. Al llegar al umbral, el pago se libera.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          {!address && (
            <>
              <motion.button whileTap={{ scale: 0.97 }} onClick={onConectar} className="btn btn-primary">
                <Wallet size={17} /> Conectar wallet
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={onDemo} className="btn btn-ghost">
                <Zap size={16} /> Probar en modo demo
              </motion.button>
            </>
          )}
        </motion.div>

        <motion.ol
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.8 } } }}
          className="mt-14 flex flex-wrap items-center gap-x-3 gap-y-2"
        >
          {PASOS.map((p, i) => (
            <motion.li
              key={p}
              variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
              className="flex items-center gap-3 text-sm"
            >
              <span className="font-mono text-[var(--mint)]">0{i + 1}</span>
              <span className="font-semibold">{p}</span>
              {i < PASOS.length - 1 && <span className="h-px w-8 bg-[var(--line-strong)]" />}
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </header>
  );
}
