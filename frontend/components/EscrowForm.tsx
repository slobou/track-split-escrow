"use client";

import { FormEvent, useRef } from "react";
import { motion } from "motion/react";
import { Plus, Sparkles } from "lucide-react";
import { nombreCancion } from "@/lib/canciones";
import { Firmante, parsearFirmantes } from "@/lib/demo";

export type NuevoEscrow = {
  track: string;
  beneficiario: string;
  monto: number;
  umbral: number;
  firmantes: Firmante[];
};

const EJEMPLO = {
  beneficiario: "GBENEF7QK3XLMN2P5RT6VWYZ4ABCDEF3HJKM",
  monto: "1500",
  umbral: "2",
  firmantes:
    "Productor: GPROD4TXN8QJ2LMV5RBKCD3HWYZ7AEF6NPQS\nVoz principal: GVOZ9RMH2KQ5TBNXD7LCW4YPEJ3AFZ8UGSV\nGuitarra: GGUIT3WPL6NZ8QDXV2KCR5HMTYE9JAB4FUS",
};

const TESTNET = {
  beneficiario: "GD6ZHGKBF67KQSFT2YVS3DGOYZWGOZZADAJ2HPWZICF6YA2UGVCRK2DU",
  productor: "GBP5SBYEIHJBPXBTCTDPP5R46QKNUKG72I7CNM5QNYI5DQTQKQ2WQCUS",
  voz: "GBGOPMNWFKWZV6Y6P4P6DSBPXT3O43XIODU2I5CUXVB6BHYRAMHOAZON",
};

type Props = {
  onCrear: (n: NuevoEscrow) => Promise<boolean>;
  busy: boolean;
  address: string | null;
  enCadena: boolean;
};

export function EscrowForm({ onCrear, busy, address, enCadena }: Props) {
  const ref = useRef<HTMLFormElement>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    const ok = await onCrear({
      track: String(d.get("track") || ""),
      beneficiario: String(d.get("beneficiario") || ""),
      monto: Number(d.get("monto")),
      umbral: Number(d.get("umbral")),
      firmantes: parsearFirmantes(String(d.get("firmantes") || "")),
    });
    if (ok) form.reset();
  }

  function cargarEjemplo() {
    const f = ref.current;
    if (!f) return;
    const base =
      enCadena && address
        ? {
            beneficiario: TESTNET.beneficiario,
            monto: "1500",
            umbral: "1",
            firmantes: `Tú: ${address}\nProductor: ${TESTNET.productor}\nVoz principal: ${TESTNET.voz}`,
          }
        : EJEMPLO;
    const valores = { ...base, track: nombreCancion() };
    (Object.keys(valores) as (keyof typeof valores)[]).forEach((k) => {
      const el = f.elements.namedItem(k) as HTMLInputElement | null;
      if (el) el.value = valores[k];
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
