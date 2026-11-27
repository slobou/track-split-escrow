"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ExternalLink, RefreshCw, Wallet, Zap } from "lucide-react";
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
  liberarOnChain,
  listarOnChain,
  recordarNombres,
  urlContrato,
  urlFriendbot,
  urlTx,
} from "@/lib/chain";
import { guardarSesion, leerSesion } from "@/lib/session";
import { connectWallet, disconnectWallet } from "@/lib/wallet";
import { Nav } from "@/components/Nav";
import { EscrowForm, NuevoEscrow } from "@/components/EscrowForm";
import { EscrowCard } from "@/components/EscrowCard";

const DEMO_ADDRESS = "GPAGADORDEMO7K2MXQ4TBNV8LRCW5HYPEJ3AFZ6UGSDX";
const TX_KEY = "track-split-tx";

type Aviso = { texto: string; hash?: string };

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
  const setMensaje = (texto: string, hash?: string) => setAviso(texto ? { texto, hash } : null);
  const [busy, setBusy] = useState(false);

  const refresh = async (quien: string | null = address) => {
    if (!quien) return;
    if (quien === DEMO_ADDRESS) return setEscrows(listarEscrows());
    try {
      setEscrows(await listarOnChain(quien));
    } catch {
      setMensaje("No se pudo leer el contrato en Testnet. Intenta actualizar.");
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
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), aviso.hash ? 14000 : 4500);
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
    entrar(DEMO_ADDRESS);
    setMensaje("Modo demo: el estado vive solo en este navegador.");
  }

  async function accion(fn: () => unknown, ok: string, id?: number): Promise<boolean> {
    setBusy(true);
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
      await refresh();
      return true;
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : "Algo salió mal.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onCrear(n: NuevoEscrow): Promise<boolean> {
    if (!address) return false;
    if (n.umbral < 1 || n.umbral > n.firmantes.length) {
      setMensaje("Las firmas necesarias deben estar entre 1 y el total de firmantes.");
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
      setMensaje("Esa firma la debe hacer la wallet de ese firmante. Conecta esa cuenta para firmar.");
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
                  <span className="font-mono">
                    <span className="text-[var(--mint)]">● Testnet</span> · conectado a contrato real
                  </span>
                  <span className="flex flex-wrap gap-4">
                    <a href={urlContrato} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                      Ver contrato <ExternalLink size={12} />
                    </a>
                    <a href={urlFriendbot(address)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                      Fondear mi cuenta de prueba <ExternalLink size={12} />
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
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="card fixed inset-x-0 bottom-6 z-50 mx-auto w-fit max-w-[90vw] border-[var(--line-strong)] bg-[#06201d]/90 px-5 py-3 text-sm font-medium"
          >
            {aviso.texto}
            {aviso.hash && (
              <a
                href={urlTx(aviso.hash)}
                target="_blank"
                rel="noreferrer"
                className="ml-3 inline-flex items-center gap-1 text-[var(--mint)] underline"
              >
                Ver transacción <ExternalLink size={13} />
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
