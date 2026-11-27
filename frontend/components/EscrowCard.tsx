"use client";

import { motion } from "motion/react";
import { Ban, Check, Disc3, ExternalLink, Lock, LockKeyhole, Rocket, Wallet } from "lucide-react";
import { urlTx } from "@/lib/chain";
import { EscrowDemo } from "@/lib/demo";
import { Waveform } from "./Waveform";

const corto = (a: string) => (a.length > 12 ? `${a.slice(0, 5)}…${a.slice(-4)}` : a);

const ESTADO = {
  Abierto: { label: "Esperando depósito", color: "#86a8a3", icon: Wallet },
  Fondeado: { label: "Fondos bloqueados", color: "#3df5b0", icon: Lock },
  Liberado: { label: "Liberado", color: "#2ea8ff", icon: Rocket },
  Cancelado: { label: "Cancelado", color: "#ff6b81", icon: Ban },
} as const;

type Props = {
  escrow: EscrowDemo;
  busy: boolean;
  txHash?: string;
  miAddress?: string;
  onDepositar: () => void;
  onFirmar: (address: string) => void;
  onLiberar: () => void;
  onCancelar: () => void;
};

export function EscrowCard({ escrow: e, busy, txHash, miAddress, onDepositar, onFirmar, onLiberar, onCancelar }: Props) {
  const meta = ESTADO[e.estado];
  const Icono = meta.icon;
  const firmas = e.aprobaron.length;
  const progreso = e.estado === "Liberado" ? 1 : Math.min(firmas / e.umbral, 1);
  const tono = e.estado === "Cancelado" ? "cancelado" : e.estado === "Liberado" ? "liberado" : "activo";
  const listo = e.estado === "Fondeado" && firmas >= e.umbral;
  const cerrado = e.estado === "Liberado" || e.estado === "Cancelado";
  const esPagador = !miAddress || e.pagador === miAddress;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="card relative overflow-hidden p-5 sm:p-7"
    >
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full opacity-20 blur-3xl"
        style={{ background: meta.color }}
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <motion.div
            animate={e.estado === "Fondeado" ? { rotate: 360 } : { rotate: 0 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[var(--line-strong)] bg-black/30"
          >
            <Disc3 size={24} style={{ color: meta.color }} />
          </motion.div>
          <div>
            <p className="font-mono text-xs text-[var(--muted)]">TRACK #{String(e.id).padStart(3, "0")}</p>
            <h3 className="font-display text-2xl leading-tight font-bold">{e.track}</h3>
          </div>
        </div>

        <div className="text-right">
          <p className="font-display text-3xl font-bold tabular-nums">
            {e.monto.toLocaleString("es")}
            <span className="ml-1 text-sm font-medium text-[var(--muted)]">XLM</span>
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: meta.color }}>
            <Icono size={13} /> {meta.label}
          </p>
        </div>
      </div>

      <div className="relative mt-6">
        <Waveform seed={e.id * 7 + e.track.length} progreso={progreso} tono={tono} />
        <div className="mt-2 flex justify-between font-mono text-[11px] text-[var(--muted)]">
          <span>
            {firmas}/{e.umbral} firmas necesarias
          </span>
          <span>{e.firmantes.length} en la mesa</span>
        </div>
      </div>

      <div className="relative mt-6 grid gap-2.5 sm:grid-cols-2">
        {e.firmantes.map((f) => {
          const firmo = e.aprobaron.includes(f.address);
          const esMia = !miAddress || f.address === miAddress;
          const pendiente = e.estado === "Fondeado" && !firmo;
          const puede = pendiente && !busy && esMia;
          const ajena = pendiente && !esMia;
          return (
            <motion.button
              key={f.address}
              type="button"
              whileHover={puede ? { y: -2 } : undefined}
              whileTap={puede ? { scale: 0.97 } : undefined}
              disabled={!puede}
              title={ajena ? "Solo la wallet de este firmante puede firmar" : undefined}
              onClick={() => onFirmar(f.address)}
              className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors disabled:cursor-default"
              style={{
                borderColor: firmo ? "rgba(61,245,176,0.55)" : "var(--line)",
                background: firmo ? "rgba(61,245,176,0.09)" : "rgba(0,0,0,0.22)",
                opacity: ajena ? 0.55 : 1,
                cursor: puede ? "pointer" : ajena ? "not-allowed" : "default",
              }}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {f.nombre}
                  {miAddress && f.address === miAddress && (
                    <span className="ml-2 rounded-full bg-[var(--mint)]/15 px-2 py-0.5 align-middle font-mono text-[10px] text-[var(--mint)]">
                      tu wallet
                    </span>
                  )}
                </span>
                <span className="font-mono text-[11px] text-[var(--muted)]">
                  {ajena ? `${corto(f.address)} · firma con su propia wallet` : corto(f.address)}
                </span>
              </span>
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[10px] font-bold"
                style={{
                  borderColor: firmo ? "var(--mint)" : "var(--line-strong)",
                  color: firmo ? "#02110e" : "var(--muted)",
                  background: firmo ? "var(--mint)" : "transparent",
                }}
              >
                {firmo ? <Check size={16} strokeWidth={3} /> : puede ? "Firmar" : ajena ? <LockKeyhole size={14} /> : "—"}
              </span>
            </motion.button>
          );
        })}
      </div>

      {txHash && (
        <div className="relative mt-5">
          <a href={urlTx(txHash)} target="_blank" rel="noreferrer" className="chip-link chip-link-muted">
            Última transacción <ExternalLink size={11} />
          </a>
        </div>
      )}

      {!cerrado && (
        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          {e.estado === "Abierto" && (
            <button type="button" disabled={busy || !esPagador} title={!esPagador ? "Solo el pagador puede bloquear fondos" : undefined} onClick={onDepositar} className="btn btn-primary">
              <Lock size={16} /> Bloquear fondos
            </button>
          )}
          {e.estado === "Fondeado" && (
            <button type="button" disabled={busy || !listo} onClick={onLiberar} className="btn btn-primary">
              <Rocket size={16} /> {listo ? "Liberar al beneficiario" : `Faltan ${e.umbral - firmas} firma(s)`}
            </button>
          )}
          <button type="button" disabled={busy || !esPagador} title={!esPagador ? "Solo el pagador puede cancelar" : undefined} onClick={onCancelar} className="btn btn-ghost">
            Cancelar
          </button>
          <span className="ml-auto font-mono text-[11px] text-[var(--muted)]">
            Pagador {corto(e.pagador)} → {corto(e.beneficiario)}
          </span>
        </div>
      )}
    </motion.li>
  );
}
