"use client";

import { FormEvent, useRef } from "react";
import { motion } from "motion/react";
import { Plus, Sparkles } from "lucide-react";
import { Firmante, parsearFirmantes } from "@/lib/demo";

export type NuevoEscrow = {
  track: string;
  beneficiario: string;
  monto: number;
  umbral: number;
  firmantes: Firmante[];
};

const EJEMPLO = {
  track: "Noches de Barrio",
  beneficiario: "GBENEF7QK3XLMN2P5RT6VWYZ4ABCDEF3HJKM",
  monto: "1500",
  umbral: "2",
  firmantes:
    "Productor: GPROD4TXN8QJ2LMV5RBKCD3HWYZ7AEF6NPQS\nVoz principal: GVOZ9RMH2KQ5TBNXD7LCW4YPEJ3AFZ8UGSV\nGuitarra: GGUIT3WPL6NZ8QDXV2KCR5HMTYE9JAB4FUS",
};

export function EscrowForm({ onCrear, busy }: { onCrear: (n: NuevoEscrow) => boolean; busy: boolean }) {
  const ref = useRef<HTMLFormElement>(null);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const ok = onCrear({
      track: String(d.get("track") || ""),
      beneficiario: String(d.get("beneficiario") || ""),
      monto: Number(d.get("monto")),
      umbral: Number(d.get("umbral")),
      firmantes: parsearFirmantes(String(d.get("firmantes") || "")),
    });
    if (ok) ref.current?.reset();
  }

  function cargarEjemplo() {
    const f = ref.current;
    if (!f) return;
    (Object.keys(EJEMPLO) as (keyof typeof EJEMPLO)[]).forEach((k) => {
      const el = f.elements.namedItem(k) as HTMLInputElement | null;
      if (el) el.value = EJEMPLO[k];
    });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="card p-6 sm:p-8"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Nueva sesión</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Define el track, el monto y quién tiene que firmar antes de soltar el pago.
          </p>
        </div>
        <button type="button" onClick={cargarEjemplo} className="btn btn-ghost !px-3.5 !py-2 text-xs">
          <Sparkles size={14} /> Cargar ejemplo
        </button>
      </div>

      <form ref={ref} onSubmit={submit} className="space-y-4">
        <input name="track" required placeholder="Nombre del track o sesión" className="input" />
        <input
          name="beneficiario"
          required
          placeholder="Beneficiario · dirección G…"
          className="input font-mono !text-[13px]"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input name="monto" required type="number" min="1" placeholder="Monto en XLM" className="input" />
          <input
            name="umbral"
            required
            type="number"
            min="1"
            defaultValue={2}
            placeholder="Firmas necesarias"
            className="input"
          />
        </div>
        <textarea
          name="firmantes"
          required
          rows={4}
          placeholder={"Un firmante por línea\nProductor: G…\nVoz principal: G…"}
          className="input font-mono !text-[13px]"
        />
        <button type="submit" disabled={busy} className="btn btn-primary w-full sm:w-auto">
          <Plus size={16} /> Crear escrow
        </button>
      </form>
    </motion.section>
  );
}
