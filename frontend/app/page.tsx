"use client";

import { FormEvent, useEffect, useState } from "react";
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

const corto = (a: string) => (a.length > 10 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a);

const field =
  "w-full border border-[var(--line)] bg-[var(--ink)] px-4 py-3 text-sm text-[var(--cream)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--copper)]";
const btnPrimary =
  "bg-[var(--copper)] px-5 py-3 font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wide text-[var(--ink)] transition hover:bg-[var(--copper-bright)] active:scale-[0.98] disabled:opacity-40";
const btnGhost =
  "border border-[var(--line)] px-4 py-2 font-[family-name:var(--font-syne)] text-sm text-[var(--cream)] transition hover:border-[var(--copper)] hover:text-[var(--copper-bright)] active:scale-[0.98]";

function estadoColor(e: EscrowDemo["estado"]) {
  switch (e) {
    case "Abierto":
      return "text-[var(--muted)]";
    case "Fondeado":
      return "text-[var(--copper-bright)]";
    case "Liberado":
      return "text-[var(--moss)]";
    case "Cancelado":
      return "text-[var(--danger)]";
  }
}

export default function Home() {
  const [address, setAddress] = useState<string | null>(null);
  const [escrows, setEscrows] = useState<EscrowDemo[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [busy, setBusy] = useState(false);

  function refresh() {
    setEscrows(listarEscrows());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function conectar() {
    try {
      const addr = await connectWallet();
      setAddress(addr);
      setMensaje("");
    } catch {
      setMensaje("No se pudo conectar la wallet. Podés pegar una dirección demo abajo.");
    }
  }

  async function desconectar() {
    try {
      await disconnectWallet();
    } catch {
      /* demo ok */
    }
    setAddress(null);
  }

  function usarDemo() {
    const demo = "GDEMO" + Math.random().toString(36).slice(2, 10).toUpperCase() + "PAGADOR";
    setAddress(demo.padEnd(56, "X").slice(0, 56));
    setMensaje("Modo demo local — el estado vive en este navegador.");
  }

  function onCrear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!address) return;
    const data = new FormData(e.currentTarget);
    const track = String(data.get("track") || "").trim();
    const beneficiario = String(data.get("beneficiario") || "").trim();
    const monto = Number(data.get("monto"));
    const umbral = Number(data.get("umbral"));
    const firmantes = String(data.get("firmantes") || "")
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    setBusy(true);
    setMensaje("");
    try {
      if (!track || !beneficiario || !monto || firmantes.length === 0) {
        throw new Error("Completá track, beneficiario, monto y firmantes.");
      }
      if (umbral < 1 || umbral > firmantes.length) {
        throw new Error("El umbral debe estar entre 1 y la cantidad de firmantes.");
      }
      const created = crearEscrow({
        track,
        pagador: address,
        beneficiario,
        monto,
        firmantes,
        umbral,
      });
      setMensaje(`Escrow #${created.id} creado para “${created.track}”.`);
      e.currentTarget.reset();
      refresh();
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : "Error");
    }
    setBusy(false);
  }

  function run(fn: () => void) {
    setBusy(true);
    setMensaje("");
    try {
      fn();
      refresh();
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : "Error");
    }
    setBusy(false);
  }

  return (
    <main className="studio-bg relative min-h-screen overflow-hidden">
      <div className="wave-mask pointer-events-none absolute inset-x-0 top-28 h-10" />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-12 px-5 py-14 md:py-20">
        <header className="animate-rise flex flex-col items-start gap-6">
          <div className="flex items-end gap-3">
            <div className="flex h-10 items-end gap-1 pb-1" aria-hidden>
              {[0.4, 0.75, 1, 0.55, 0.85, 0.45].map((h, i) => (
                <span
                  key={i}
                  className="eq-bar w-1.5 rounded-sm bg-[var(--copper)]"
                  style={{ height: `${h * 28}px`, animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
            <p className="font-[family-name:var(--font-syne)] text-sm tracking-[0.28em] text-[var(--copper)] uppercase">
              Track Split
            </p>
          </div>

          <h1 className="max-w-xl font-[family-name:var(--font-syne)] text-4xl leading-[1.05] font-bold tracking-tight text-[var(--cream)] md:text-5xl">
            Escrow con firmas para tu próximo lanzamiento
          </h1>

          <p className="max-w-lg text-lg leading-relaxed text-[var(--muted)]">
            El pagador bloquea el pago de la sesión. Productor y artistas aprueban. Al llegar al
            umbral, se libera al beneficiario.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {address ? (
              <>
                <button type="button" onClick={desconectar} className={btnGhost}>
                  <span className="font-mono text-xs">{corto(address)}</span> · Salir
                </button>
                <span className="text-sm text-[var(--muted)]">Testnet / demo local</span>
              </>
            ) : (
              <>
                <button type="button" onClick={conectar} className={btnPrimary}>
                  Conectar wallet
                </button>
                <button type="button" onClick={usarDemo} className={btnGhost}>
                  Modo demo
                </button>
              </>
            )}
          </div>
        </header>

        {!address && (
          <p className="animate-rise text-[var(--muted)]" style={{ animationDelay: "0.1s" }}>
            Conectá una wallet Stellar (Testnet) o entrá en modo demo para recorrer el flujo sin
            red.
          </p>
        )}

        {address && (
          <>
            <section
              className="animate-rise border border-[var(--line)] bg-[var(--panel)]/80 p-6 md:p-8"
              style={{ animationDelay: "0.12s" }}
            >
              <h2 className="mb-1 font-[family-name:var(--font-syne)] text-xl font-semibold">
                Nuevo escrow
              </h2>
              <p className="mb-6 text-sm text-[var(--muted)]">
                Una canción, un monto, N firmantes. El contrato Soroban replica este flujo on-chain.
              </p>

              <form onSubmit={onCrear} className="space-y-4">
                <input
                  name="track"
                  required
                  placeholder="Nombre del track / sesión"
                  className={field}
                />
                <input
                  name="beneficiario"
                  required
                  placeholder="Beneficiario (G…)"
                  className={`${field} font-mono text-xs md:text-sm`}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    name="monto"
                    required
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Monto (unidades)"
                    className={field}
                  />
                  <input
                    name="umbral"
                    required
                    type="number"
                    min="1"
                    defaultValue={2}
                    placeholder="Umbral de firmas"
                    className={field}
                  />
                </div>
                <textarea
                  name="firmantes"
                  required
                  rows={3}
                  placeholder={"Firmantes (uno por línea)\nG… productor\nG… artista"}
                  className={`${field} font-mono text-xs md:text-sm`}
                />
                <button type="submit" disabled={busy} className={`${btnPrimary} w-full sm:w-auto`}>
                  {busy ? "Creando…" : "Crear escrow"}
                </button>
              </form>
            </section>

            <section className="animate-rise space-y-4" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
                  Escrows
                </h2>
                <button type="button" onClick={refresh} className={btnGhost}>
                  Actualizar
                </button>
              </div>

              {escrows.length === 0 && (
                <p className="border border-dashed border-[var(--line)] px-5 py-10 text-center text-[var(--muted)]">
                  Todavía no hay escrows en este navegador.
                </p>
              )}

              <ul className="space-y-4">
                {escrows.map((e) => (
                  <li
                    key={e.id}
                    className="border border-[var(--line)] bg-[var(--ink-soft)]/90 p-5 md:p-6"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
                        #{e.id} · {e.track}
                      </h3>
                      <span className={`text-sm font-medium ${estadoColor(e.estado)}`}>
                        {e.estado}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
                      <div>
                        Monto:{" "}
                        <span className="font-mono text-[var(--cream)]">{e.monto}</span>
                      </div>
                      <div>
                        Firmas:{" "}
                        <span className="text-[var(--cream)]">
                          {e.aprobaciones}/{e.umbral}
                        </span>
                      </div>
                      <div className="font-mono text-xs">
                        Pagador {corto(e.pagador)}
                      </div>
                      <div className="font-mono text-xs">
                        Benef. {corto(e.beneficiario)}
                      </div>
                    </dl>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {e.estado === "Abierto" && (
                        <button
                          type="button"
                          disabled={busy}
                          className={btnPrimary}
                          onClick={() =>
                            run(() => {
                              depositar(e.id, address);
                              setMensaje(`Escrow #${e.id} fondeado.`);
                            })
                          }
                        >
                          Depositar
                        </button>
                      )}
                      {e.estado === "Fondeado" && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            className={btnPrimary}
                            onClick={() =>
                              run(() => {
                                aprobar(e.id, address);
                                setMensaje(`Aprobaste el escrow #${e.id}.`);
                              })
                            }
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            disabled={busy || e.aprobaciones < e.umbral}
                            className={btnGhost}
                            onClick={() =>
                              run(() => {
                                liberar(e.id);
                                setMensaje(`Escrow #${e.id} liberado.`);
                              })
                            }
                          >
                            Liberar
                          </button>
                        </>
                      )}
                      {(e.estado === "Abierto" || e.estado === "Fondeado") && (
                        <button
                          type="button"
                          disabled={busy}
                          className={btnGhost}
                          onClick={() =>
                            run(() => {
                              cancelar(e.id, address);
                              setMensaje(`Escrow #${e.id} cancelado.`);
                            })
                          }
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {mensaje && (
          <p className="border-l-2 border-[var(--copper)] pl-4 text-sm text-[var(--cream)]">
            {mensaje}
          </p>
        )}

        <footer className="border-t border-[var(--line)] pt-8 text-sm text-[var(--muted)]">
          Soroban · Oppia Bootcamp ·{" "}
          <span className="text-[var(--cream)]/70">cargo test && stellar contract build</span>
        </footer>
      </div>
    </main>
  );
}
