import type { Metadata } from "next";
import { Syne, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const source = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Track Split — Escrow musical",
  description:
    "Bloquea fondos para un lanzamiento. Productor y artistas firman antes de liberar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${syne.variable} ${source.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
