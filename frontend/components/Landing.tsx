"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Check, ShieldCheck, Users } from "lucide-react";
import { Mixer } from "./Mixer";

const fade = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.65, ease: "easeOut" as const },
};

const TRACKS = ["Noches de Barrio", "Sesión Dub Vol. 2", "Cumbia Eléctrica", "Demo Voz y Guitarra", "Beat Tape 07", "Single Verano", "Mezcla Final", "Coros en Vivo"];

const PASOS = [
  { n: "01", titulo: "Se crea la sesión", texto: "El pagador define el track, el monto, quiénes firman y cuántas firmas hacen falta.", tag: "pagador" },
  { n: "02", titulo: "Se bloquean los fondos", texto: "El pago queda registrado como bloqueado. Ni pagador ni beneficiario lo mueven solos.", tag: "contrato" },
  { n: "03", titulo: "El equipo firma", texto: "Productor y artistas aprueban cada uno desde su wallet. Nadie firma dos veces.", tag: "firmantes" },
  { n: "04", titulo: "Se libera el pago", texto: "Con el umbral cumplido se libera al beneficiario. Si no, el pagador cancela.", tag: "beneficiario" },
];

const RAZONES = [
  { icon: ShieldCheck, titulo: "Reglas que nadie cambia", texto: "El umbral y los firmantes quedan fijados al crear la sesión, sin depender de una persona." },
  { icon: Users, titulo: "Todos ven el mismo estado", texto: "Quién firmó y cuántas firmas faltan es público: no hay versiones distintas del trato." },
  { icon: Check, titulo: "Pensado para equipos chicos", texto: "Una canción, un monto, un puñado de firmantes. Sin intermediarios de por medio." },
];

function Titulo({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <motion.div {...fade}>
      <p className="font-mono text-xs tracking-[0.2em] text-[var(--mint)] uppercase">{eyebrow}</p>
      <h2 className="font-display mt-3 max-w-2xl text-3xl leading-tight font-bold sm:text-5xl">{children}</h2>
    </motion.div>
  );
}

export function Landing() {
  return (
    <>
      <div className="relative -mx-5 overflow-hidden border-y border-[var(--line)] bg-white/[0.02] py-5">
        <div className="marquee-track">
          {[...TRACKS, ...TRACKS].map((t, i) => (
            <span key={i} className="font-display flex items-center gap-8 pr-8 text-2xl font-bold whitespace-nowrap text-white/25">
              {t}
              <span className="bg-grad h-2 w-2 rounded-full" />
            </span>
          ))}
        </div>
      </div>

      <section id="como-funciona" className="scroll-mt-24">
        <Titulo eyebrow="Cómo funciona">Cuatro pasos entre la sesión y el pago.</Titulo>

        <ol className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {PASOS.map((p, i) => (
            <motion.li
              key={p.n}
              {...fade}
              transition={{ ...fade.transition, delay: i * 0.06 }}
              whileHover="hover"
              className="group relative grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-1 px-2 py-6 sm:grid-cols-[2.5rem_1fr_1.2fr_9rem] sm:px-5"
            >
              <motion.span
                variants={{ hover: { scaleX: 1 } }}
                initial={{ scaleX: 0 }}
                className="bg-grad absolute inset-y-0 left-0 w-full origin-left opacity-[0.07]"
              />
              <span className="font-mono text-sm text-[var(--mint)]">{p.n}</span>
              <h3 className="font-display text-xl font-bold sm:text-2xl">{p.titulo}</h3>
              <p className="col-span-2 text-[15px] leading-relaxed text-[var(--muted)] sm:col-span-1">{p.texto}</p>
              <span className="hidden justify-self-end rounded-full border border-[var(--line-strong)] px-3 py-1 font-mono text-[11px] text-[var(--muted)] sm:block">
                {p.tag}
              </span>
            </motion.li>
          ))}
        </ol>
      </section>

      <section id="mezcladora" className="scroll-mt-24">
        <Titulo eyebrow="Mezcladora">Pruébalo aquí mismo: firma con los faders.</Titulo>
        <motion.div {...fade} className="mt-12">
          <Mixer />
        </motion.div>
      </section>

      <section id="por-que" className="scroll-mt-24">
        <Titulo eyebrow="Por qué on-chain">Un trato claro desde antes de grabar.</Titulo>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {RAZONES.map((r, i) => (
            <motion.article key={r.titulo} {...fade} transition={{ ...fade.transition, delay: i * 0.1 }} className="border-t border-[var(--line-strong)] pt-6">
              <r.icon size={22} className="text-[var(--mint)]" />
              <h3 className="font-display mt-4 text-lg font-bold">{r.titulo}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">{r.texto}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <motion.section {...fade} className="card relative overflow-hidden px-6 py-16 text-center sm:py-24">
        <div className="bg-grad pointer-events-none absolute inset-0 opacity-[0.1]" />
        <h2 className="font-display relative mx-auto max-w-2xl text-4xl leading-tight font-extrabold sm:text-6xl">
          Tu próxima sesión, <span className="text-grad inline-block">con firmas.</span>
        </h2>
        <p className="relative mx-auto mt-5 max-w-md text-[var(--muted)]">
          Conecta tu wallet de Testnet o entra en modo demo. No cuesta nada.
        </p>
        <Link href="/estudio" className="btn btn-primary relative mt-9 !rounded-full !px-8 !py-4">
          Entrar al estudio <ArrowUpRight size={18} />
        </Link>
      </motion.section>
    </>
  );
}
