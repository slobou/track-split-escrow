"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RefreshCw } from "lucide-react";
import {
  aprobar,
  cancelar,
  crearEscrow,
  depositar,
  EscrowDemo,
  liberar,
  listarEscrows,
} from "@/lib/demo";
import { connectWallet, disconnectWallet } from "@/lib/wallet";
import { Hero } from "@/components/Hero";
import { EscrowForm, NuevoEscrow } from "@/components/EscrowForm";
import { EscrowCard } from "@/components/EscrowCard";

export default function Home() {
  const [address, setAddress] = useState<string | null>(null);
  const [escrows, setEscrows] = useState<EscrowDemo[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => setEscrows(listarEscrows());

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(""), 4500);
    return () => clearTimeout(t);
  }, [mensaje]);

  async function conectar() {
    try {
      setAddress(await connectWallet());
    } catch {
      setMensaje("No se pudo conectar la wallet. Podés probar el modo demo.");
    }
  }

  async function salir() {
    try {
      await disconnectWallet();
    } catch {}
    setAddress(null);
  }

  function demo() {
    setAddress("GPAGADOR" + "DEMO7K2MXQ4TBNV8LRCW5HYPEJ3AFZ6UGSD".slice(0, 36) + "X");
    setMensaje("Modo demo: el estado vive solo en este navegador.");
  }

  function accion(fn: () => void, ok: string) {
    setBusy(true);
    try {
      fn();
      setMensaje(ok);
      refresh();
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : "Algo salió mal.");
    }
    setBusy(false);
  }

  function onCrear(n: NuevoEscrow): boolean {
    if (!address) return false;
    if (n.umbral < 1 || n.umbral > n.firmantes.length) {
      setMensaje("Las firmas necesarias deben estar entre 1 y el total de firmantes.");
      return false;
    }
    let creado: EscrowDemo | null = null;
    accion(() => {
      creado = crearEscrow({ ...n, pagador: address });
    }, "Escrow creado. Ahora bloqueá los fondos.");
    return creado !== null;
  }

  const bloqueado = escrows
    .filter((e) => e.estado === "Fondeado")
    .reduce((s, e) => s + e.monto, 0);
  const liberados = escrows.filter((e) => e.estado === "Liberado").length;

  return (
    <>
      <div className="aurora" />
      <div className="grain" />

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-14 px-5 py-8 sm:py-10">
        <Hero address={address} onConectar={conectar} onDemo={demo} onSalir={salir} />

        <AnimatePresence>
          {address && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col gap-10"
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { k: "Bloqueado", v: bloqueado.toLocaleString("es"), u: "XLM" },
                  { k: "Escrows", v: String(escrows.length), u: "" },
                  { k: "Liberados", v: String(liberados), u: "" },
                ].map((s) => (
                  <div key={s.k} className="card px-5 py-4">
                    <p className="font-mono text-[11px] tracking-wider text-[var(--muted)] uppercase">{s.k}</p>
                    <p className="font-display mt-1 text-2xl font-bold tabular-nums sm:text-3xl">
                      {s.v}
                      {s.u && <span className="ml-1 text-xs font-medium text-[var(--muted)]">{s.u}</span>}
                    </p>
                  </div>
                ))}
              </div>

              <EscrowForm onCrear={onCrear} busy={busy} />

              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold">Sesiones</h2>
                  <button type="button" onClick={refresh} className="btn btn-ghost !px-3.5 !py-2 text-xs">
                    <RefreshCw size={14} /> Actualizar
                  </button>
                </div>

                {escrows.length === 0 ? (
                  <p className="card border-dashed px-6 py-12 text-center text-[var(--muted)]">
                    Todavía no hay sesiones. Creá la primera arriba.
                  </p>
                ) : (
                  <ul className="space-y-5">
                    <AnimatePresence initial={false}>
                      {escrows.map((e) => (
                        <EscrowCard
                          key={e.id}
                          escrow={e}
                          busy={busy}
                          onDepositar={() => accion(() => depositar(e.id, address), "Fondos bloqueados.")}
                          onFirmar={(a) => accion(() => aprobar(e.id, a), "Firma registrada.")}
                          onLiberar={() => accion(() => liberar(e.id), "Pago liberado al beneficiario.")}
                          onCancelar={() => accion(() => cancelar(e.id, address), "Escrow cancelado.")}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
                <p className="font-mono text-[11px] text-[var(--muted)]">
                  Demo: tocá un firmante para simular su firma desde su wallet.
                </p>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="border-t border-[var(--line)] pt-6 font-mono text-xs text-[var(--muted)]">
          Soroban · Oppia Bootcamp · Stellar Testnet
        </footer>
      </main>

      <AnimatePresence>
        {mensaje && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="card fixed inset-x-0 bottom-6 z-50 mx-auto w-fit max-w-[90vw] border-[var(--line-strong)] bg-[#06201d]/90 px-5 py-3 text-sm font-medium"
          >
            {mensaje}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
