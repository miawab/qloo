import type { Metadata } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const mono = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Overture",
  description: "Which film should be your next stage musical? An agent that scores film adaptations by audience fit, with the evidence behind every call.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${archivo.variable} ${mono.variable} font-sans antialiased`}>
        <header className="no-print absolute inset-x-0 top-0 z-20">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_14px_4px_#ff4d4f88]" />
              <span className="text-base font-semibold tracking-[0.22em] sm:text-lg sm:tracking-[0.28em]">OVERTURE</span>
            </Link>
            <div className="label flex gap-4 text-muted sm:gap-7">
              <Link href="/proof" className="hover:text-ink">Proof</Link>
              <Link href="/how" className="hover:text-ink">
                How<span className="hidden sm:inline"> it works</span>
              </Link>
              <a href="https://github.com/miawab/qloo" className="hover:text-ink">Code</a>
            </div>
          </nav>
        </header>
        {children}
        <footer className="no-print mx-auto max-w-6xl border-t border-line px-5 py-10 text-xs text-muted">
          Audience data from Qloo. Results describe groups of people, never individuals. Film and brand names are used as data only.
        </footer>
      </body>
    </html>
  );
}
