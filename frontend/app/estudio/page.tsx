"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RefreshCw, Wallet, Zap } from "lucide-react";
import {
  aprobar,
  cancelar,
  crearEscrow,
  depositar,
  EscrowDemo,
  liberar,
  listarEscrows,
} from "@/lib/demo";
import { guardarSesion, leerSesion } from "@/lib/session";
import { connectWallet, disconnectWallet } from "@/lib/wallet";
import { Nav } from "@/components/Nav";
import { EscrowForm, NuevoEscrow } from "@/components/EscrowForm";
import { EscrowCard } from "@/components/EscrowCard";

export default function Estudio() {
  const [address, setAddress] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [escrows, setEscrows] = useState<EscrowDemo[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => setEscrows(listarEscrows());

  useEffect(() => {
    setAddress(leerSesion());
    setListo(true);
    refresh();
  }, []);

  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(""), 4500);
    return () => clearTimeout(t);
  }, [mensaje]);

  function entrar(a: string | null) {
    setAddress(a);
    guardarSesion(a);
  }

  async function conectar() {
    try {
      entrar(await connectWallet());
    } catch {
      setMensaje("No se pudo conectar la wallet. Puedes probar el modo demo.");
    }
  }

  async function salir() {
    try {
      await disconnectWallet();
    } catch {}
    entrar(null);
  }

  function demo() {
    entrar("GPAGADORDEMO7K2MXQ4TBNV8LRCW5HYPEJ3AFZ6UGSDX");
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
    let creado = false;
    accion(() => {
      crearEscrow({ ...n, pagador: address });
      creado = true;
    }, "Escrow creado. Ahora bloquea los fondos.");
    return creado;
  }

  const bloqueado = escrows.filter((e) => e.estado === "Fondeado").reduce((s, e) => s + e.monto, 0);
  const liberados = escrows.filter((e) => e.estado === "Liberado").length;

  return (
    <>
      <div className="aurora" />
      <div className="grain" />
      <Nav variante="estudio" address={address} onSalir={salir} />

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-5 pt-32 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="font-mono text-xs tracking-[0.2em] text-[var(--mint)] uppercase">Estudio</p>
          <h1 className="font-display mt-3 text-4xl font-extrabold sm:text-6xl">
            Tus sesiones <span className="text-grad">en firme.</span>
          </h1>
        </motion.div>

        {listo && !address && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card flex flex-col items-start gap-5 p-7 sm:p-10"
          >
            <h2 className="font-display text-2xl font-bold">Elige cómo entrar</h2>
            <p className="max-w-md text-[var(--muted)]">
              Conecta una wallet de Stellar Testnet o usa el modo demo para recorrer todo el flujo sin
              gastar nada.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={conectar} className="btn btn-primary !rounded-full">
                <Wallet size={17} /> Conectar wallet
              </button>
              <button type="button" onClick={demo} className="btn btn-ghost !rounded-full">
                <Zap size={16} /> Modo demo
              </button>
            </div>
          </motion.div>
        )}

        {address && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col gap-10">
            <div className="grid grid-cols-3 gap-3">
              {[
                { k: "Bloqueado", v: bloqueado.toLocaleString("es"), u: "XLM" },
                { k: "Sesiones", v: String(escrows.length), u: "" },
                { k: "Liberadas", v: String(liberados), u: "" },
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
                <button type="button" onClick={refresh} className="btn btn-ghost !rounded-full !px-4 !py-2 text-xs">
                  <RefreshCw size={14} /> Actualizar
                </button>
              </div>

              {escrows.length === 0 ? (
                <p className="card border-dashed px-6 py-12 text-center text-[var(--muted)]">
                  Todavía no hay sesiones. Crea la primera arriba.
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
                Demo: toca un firmante para simular su firma desde su wallet.
              </p>
            </section>
          </motion.div>
        )}
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
