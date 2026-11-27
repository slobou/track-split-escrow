"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, CircleCheck, ExternalLink, LoaderCircle, RefreshCw, Wallet, X, Zap } from "lucide-react";
import {
  aprobar,
  cancelar,
  crearEscrow,
  depositar,
  EscrowDemo,
  liberar,
  listarEscrows,
} from "@/lib/demo";
import {
  aprobarOnChain,
  cancelarOnChain,
  crearOnChain,
  depositarOnChain,
  escucharFase,
  leerUno,
  liberarOnChain,
  listarOnChain,
  recordarNombres,
  urlContrato,
  urlFriendbot,
  urlTx,
} from "@/lib/chain";
import { guardarSesion, leerSesion } from "@/lib/session";
import { connectWallet, disconnectWallet, MENSAJE_RED, redIncorrecta } from "@/lib/wallet";
import { Nav } from "@/components/Nav";
import { EscrowForm, NuevoEscrow } from "@/components/EscrowForm";
import { EscrowCard } from "@/components/EscrowCard";

const DEMO_ADDRESS = "GPAGADORDEMO7K2MXQ4TBNV8LRCW5HYPEJ3AFZ6UGSDX";
const TX_KEY = "track-split-tx";

const DURACION = (a: Aviso) => (a.hash ? 14000 : a.error ? 8000 : 4500);

type Aviso = { texto: string; hash?: string; error?: boolean };

function leerTx(): Record<number, string> {
  try {
    return JSON.parse(localStorage.getItem(TX_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function Estudio() {
  const [address, setAddress] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [escrows, setEscrows] = useState<EscrowDemo[]>([]);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [txs, setTxs] = useState<Record<number, string>>({});
  const enCadena = !!address && address !== DEMO_ADDRESS;
  const setMensaje = (texto: string, hash?: string, error = false) => setAviso(texto ? { texto, hash, error } : null);
  const [busy, setBusy] = useState(false);
  const [fase, setFase] = useState("");

  const refresh = async (quien: string | null = address) => {
    if (!quien) return;
    if (quien === DEMO_ADDRESS) return setEscrows(listarEscrows());
    try {
      setEscrows(await listarOnChain(quien));
    } catch {
      setMensaje("No se pudo leer el contrato en Testnet. Intenta actualizar.", undefined, true);
    }
  };

  useEffect(() => {
    const guardada = leerSesion();
    setAddress(guardada);
    setTxs(leerTx());
    setListo(true);
    void refresh(guardada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    escucharFase(setFase);
    return () => escucharFase(null);
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), DURACION(aviso));
    return () => clearTimeout(t);
  }, [aviso]);

  function entrar(a: string | null) {
    setAddress(a);
    guardarSesion(a);
    setEscrows([]);
    if (a) void refresh(a);
  }

  async function conectar() {
    try {
      const a = await connectWallet();
      entrar(a);
      if (await redIncorrecta()) setMensaje(MENSAJE_RED, undefined, true);
    } catch {
      setMensaje("No se pudo conectar la wallet. Puedes probar el modo demo.", undefined, true);
    }
  }

  async function salir() {
    try {
      await disconnectWallet();
    } catch {}
    entrar(null);
  }

  function demo() {
    entrar(DEMO_ADDRESS);
    setMensaje("Modo demo: el estado vive solo en este navegador.");
  }

  async function accion(fn: () => unknown, ok: string, id?: number): Promise<boolean> {
    setBusy(true);
    setFase(enCadena ? "Preparando…" : "");
    try {
      const r = (await fn()) as { hash?: string; id?: number } | undefined;
      const hash = r?.hash;
      const idTx = id ?? r?.id;
      if (hash && idTx) {
        const nuevo = { ...txs, [idTx]: hash };
        setTxs(nuevo);
        localStorage.setItem(TX_KEY, JSON.stringify(nuevo));
      }
      setMensaje(ok, hash);
      if (enCadena && idTx && address) {
        setFase("Actualizando la sesión…");
        const nueva = await leerUno(idTx, address);
        if (nueva) setEscrows((prev) => [nueva, ...prev.filter((x) => x.id !== nueva.id)].sort((a, b) => b.id - a.id));
      } else {
        await refresh();
      }
      return true;
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : "Algo salió mal.", undefined, true);
      return false;
    } finally {
      setBusy(false);
      setFase("");
    }
  }

  async function onCrear(n: NuevoEscrow): Promise<boolean> {
    if (!address) return false;
    if (n.umbral < 1 || n.umbral > n.firmantes.length) {
      setMensaje("Las firmas necesarias deben estar entre 1 y el total de firmantes.", undefined, true);
      return false;
    }
    if (!enCadena) return accion(() => crearEscrow({ ...n, pagador: address }), "Escrow creado. Ahora bloquea los fondos.");
    recordarNombres(n.firmantes);
    return accion(() => crearOnChain(address, n), "Escrow creado en Testnet. Ahora bloquea los fondos.");
  }

  function firmar(id: number, quien: string) {
    if (!address) return;
    if (!enCadena) return accion(() => aprobar(id, quien), "Firma registrada.");
    if (quien !== address) {
      setMensaje("Esa firma la debe hacer la wallet de ese firmante. Conecta esa cuenta para firmar.", undefined, true);
      return;
    }
    return accion(() => aprobarOnChain(id, address), "Firma registrada en Testnet.", id);
  }

  const bloqueado = escrows.filter((e) => e.estado === "Fondeado").reduce((s, e) => s + e.monto, 0);
  const liberados = escrows.filter((e) => e.estado === "Liberado").length;

  return (
    <>
      <div className="aurora" />
      <div className="grain" />
      <Nav variante="estudio" address={address} onSalir={salir} />

      <AnimatePresence>
        {busy && enCadena && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-white/5"
          >
            <motion.div
              className="h-full w-1/3 bg-[var(--grad)]"
              style={{ background: "linear-gradient(90deg, transparent, var(--mint), var(--blue), transparent)" }}
              animate={{ x: ["-100%", "300%"] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
            <div
              className="card flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs"
              style={{ borderColor: enCadena ? "rgba(61,245,176,0.4)" : "var(--line)" }}
            >
              {enCadena ? (
                <>
                  {busy && fase ? (
                    <span className="inline-flex items-center gap-2 font-mono text-[var(--mint)]">
                      <LoaderCircle size={14} className="animate-spin" /> {fase}
                    </span>
                  ) : (
                    <span className="font-mono">
                      <span className="text-[var(--mint)]">● Testnet</span> · conectado a contrato real
                    </span>
                  )}
                  <span className="flex flex-wrap gap-2">
                    <a href={urlContrato} target="_blank" rel="noreferrer" className="chip-link chip-link-muted">
                      Ver contrato <ExternalLink size={11} />
                    </a>
                    <a href={urlFriendbot(address)} target="_blank" rel="noreferrer" className="chip-link chip-link-muted">
                      Fondear cuenta de prueba <ExternalLink size={11} />
                    </a>
                  </span>
                </>
              ) : (
                <span className="font-mono text-[var(--muted)]">
                  ● Modo demo · los datos viven solo en este navegador. Conecta una wallet para usar Testnet.
                </span>
              )}
            </div>

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

            <EscrowForm onCrear={onCrear} busy={busy} address={address} enCadena={enCadena} />

            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Sesiones</h2>
                <button type="button" onClick={() => void refresh()} className="btn btn-ghost !rounded-full !px-4 !py-2 text-xs">
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
                        txHash={txs[e.id]}
                        miAddress={enCadena ? address : undefined}
                        onDepositar={() =>
                          enCadena
                            ? accion(() => depositarOnChain(e.id, address), "Fondos bloqueados en Testnet.", e.id)
                            : accion(() => depositar(e.id, address), "Fondos bloqueados.")
                        }
                        onFirmar={(a) => firmar(e.id, a)}
                        onLiberar={() =>
                          enCadena
                            ? accion(() => liberarOnChain(e.id, address), "Pago liberado en Testnet.", e.id)
                            : accion(() => liberar(e.id), "Pago liberado al beneficiario.")
                        }
                        onCancelar={() =>
                          enCadena
                            ? accion(() => cancelarOnChain(e.id, address), "Escrow cancelado en Testnet.", e.id)
                            : accion(() => cancelar(e.id, address), "Escrow cancelado.")
                        }
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
              {enCadena ? (
                <p className="font-mono text-[11px] text-[var(--muted)]">
                  Cada firma la hace la wallet de ese firmante. Toca tu nombre para firmar con la cuenta conectada.
                </p>
              ) : (
                <p className="font-mono text-[11px] text-[var(--muted)]">
                  Demo: toca un firmante para simular su firma desde su wallet.
                </p>
              )}
            </section>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {aviso && (
          <motion.div
            key={aviso.texto + (aviso.hash ?? "")}
            role="status"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="fixed top-24 right-4 left-4 z-50 overflow-hidden rounded-2xl border bg-[#06201d]/95 shadow-2xl shadow-black/50 backdrop-blur-xl sm:left-auto sm:w-[380px]"
            style={{ borderColor: aviso.error ? "rgba(255,107,129,0.5)" : "var(--line-strong)" }}
          >
            <div className="flex items-start gap-3 p-4">
              {aviso.error ? (
                <CircleAlert size={20} className="mt-0.5 shrink-0 text-[#ff6b81]" />
              ) : (
                <CircleCheck size={20} className="mt-0.5 shrink-0 text-[var(--mint)]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug font-medium">{aviso.texto}</p>
                {aviso.hash && (
                  <a href={urlTx(aviso.hash)} target="_blank" rel="noreferrer" className="chip-link mt-3">
                    Ver en Stellar Expert <ExternalLink size={11} />
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => setAviso(null)}
                aria-label="Cerrar aviso"
                className="-mt-1 -mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: DURACION(aviso) / 1000, ease: "linear" }}
              style={{ transformOrigin: "left", background: aviso.error ? "#ff6b81" : "var(--mint)" }}
              className="h-0.5 opacity-70"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
