"use client";

import { useEffect, useState } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import { Check, RotateCcw, Rocket } from "lucide-react";
import { Waveform } from "./Waveform";

const ALTO = 170;
const KNOB = 52;

function Fader({
  nombre,
  firmo,
  bloqueado,
  onChange,
}: {
  nombre: string;
  firmo: boolean;
  bloqueado: boolean;
  onChange: (v: boolean) => void;
}) {
  const y = useMotionValue(firmo ? 0 : ALTO);
  const relleno = useTransform(y, (v) => ALTO - v + KNOB / 2);

  useEffect(() => {
    animate(y, firmo ? 0 : ALTO, { type: "spring", stiffness: 300, damping: 28 });
  }, [firmo, y]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2.5">
        <div className="relative w-[58px] rounded-full border border-[var(--line)] bg-black/40" style={{ height: ALTO + KNOB }}>
          <motion.div
            className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-gradient-to-t from-[#3b6bff] via-[#18d4c8] to-[#3df5b0] opacity-70"
            style={{ height: relleno, maxHeight: ALTO + KNOB - 12 }}
          />
          <motion.button
            type="button"
            aria-label={`${firmo ? "Quitar firma de" : "Firmar como"} ${nombre}`}
            drag={bloqueado ? false : "y"}
            dragConstraints={{ top: 0, bottom: ALTO }}
            dragElastic={0}
            dragMomentum={false}
            style={{ y, height: KNOB }}
            onDragEnd={() => {
              const v = y.get() < ALTO / 2;
              animate(y, v ? 0 : ALTO, { type: "spring", stiffness: 300, damping: 28 });
              onChange(v);
            }}
            onTap={() => !bloqueado && onChange(!firmo)}
            whileTap={{ scale: 0.94 }}
            className="glossy absolute inset-x-0 top-0 grid cursor-grab place-items-center rounded-2xl bg-gradient-to-b from-white to-[#bfeee6] active:cursor-grabbing"
          >
            <span className="h-1 w-6 rounded-full bg-[#02110e]/60" />
          </motion.button>
        </div>

        <div className="flex flex-col justify-between py-1.5">
          {Array.from({ length: 10 }).map((_, i) => {
            const encendido = firmo && i >= 10 - 10;
            return (
              <motion.span
                key={i}
                animate={{ opacity: encendido ? 1 : 0.18, scaleX: encendido ? 1 : 0.7 }}
                transition={{ delay: firmo ? (9 - i) * 0.03 : 0 }}
                className="block h-1.5 w-3 origin-left rounded-full"
                style={{ background: i < 2 ? "#ff6b81" : i < 5 ? "#ffd166" : "#3df5b0" }}
              />
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-bold">{nombre}</p>
        <p className="font-mono text-[11px]" style={{ color: firmo ? "var(--mint)" : "var(--muted)" }}>
          {firmo ? "firmó" : "pendiente"}
        </p>
      </div>
    </div>
  );
}

const CANALES = ["Productor", "Voz principal", "Guitarra"];
const UMBRAL = 2;

export function Mixer() {
  const [firmas, setFirmas] = useState([false, false, false]);
  const [liberado, setLiberado] = useState(false);
  const total = firmas.filter(Boolean).length;
  const listo = total >= UMBRAL;

  function set(i: number, v: boolean) {
    if (liberado) return;
    setFirmas((f) => f.map((x, j) => (j === i ? v : x)));
  }

  function reiniciar() {
    setFirmas([false, false, false]);
    setLiberado(false);
  }

  return (
    <div className="card overflow-hidden p-6 sm:p-10">
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="font-mono text-xs text-[var(--muted)]">SESIÓN · NOCHES DE BARRIO · 1.500 XLM</p>
          <div className="mt-5 rounded-3xl border border-[var(--line)] bg-black/30 p-5">
            <Waveform seed={11} progreso={liberado ? 1 : total / UMBRAL > 1 ? 1 : total / UMBRAL} barras={48} tono="activo" />
            <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-[var(--muted)]">
              <span>
                {Math.min(total, UMBRAL)}/{UMBRAL} firmas necesarias
              </span>
              <span>{liberado ? "pago liberado" : listo ? "listo para liberar" : "fondos bloqueados"}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!listo || liberado}
              onClick={() => setLiberado(true)}
              className="btn btn-primary !rounded-full"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={liberado ? "ok" : "go"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="inline-flex items-center gap-2"
                >
                  {liberado ? <Check size={17} strokeWidth={3} /> : <Rocket size={16} />}
                  {liberado ? "Pago liberado" : "Liberar al beneficiario"}
                </motion.span>
              </AnimatePresence>
            </button>
            <button type="button" onClick={reiniciar} className="btn btn-ghost !rounded-full !px-4" aria-label="Reiniciar">
              <RotateCcw size={15} />
            </button>
          </div>
          <p className="mt-5 text-sm text-[var(--muted)]">
            Sube los faders para firmar. Con 2 de 3 el contrato deja liberar el pago.
          </p>
        </div>

        <div className="flex justify-around gap-2 rounded-3xl border border-[var(--line)] bg-black/25 px-3 py-8 sm:px-8">
          {CANALES.map((c, i) => (
            <Fader key={c} nombre={c} firmo={firmas[i]} bloqueado={liberado} onChange={(v) => set(i, v)} />
          ))}
        </div>
      </div>
    </div>
  );
}
