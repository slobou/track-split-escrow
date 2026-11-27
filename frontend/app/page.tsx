import { Hero } from "@/components/Hero";
import { Landing } from "@/components/Landing";
import { Nav } from "@/components/Nav";

export default function Home() {
  return (
    <>
      <div className="aurora" />
      <div className="grain" />
      <Nav variante="landing" />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-28 px-5 pb-10">
        <Hero />
        <Landing />

        <footer className="border-t border-[var(--line)] pt-6 font-mono text-xs text-[var(--muted)]">
          Soroban · Oppia Bootcamp · Stellar Testnet
        </footer>
      </main>
    </>
  );
}
