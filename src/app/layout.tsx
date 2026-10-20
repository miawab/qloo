import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const tight = Inter_Tight({ variable: "--font-tight", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "Overture",
  description: "Which film should be your next stage musical? An agent that scores film adaptations by audience fit, with the evidence behind every call.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${tight.variable} font-sans antialiased`}>
        <header className="no-print absolute inset-x-0 top-0 z-20">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_14px_4px_#ff4d4f88]" />
              <span className="text-lg font-semibold tracking-[0.28em]">OVERTURE</span>
            </Link>
            <div className="label flex gap-7 text-muted">
              <Link href="/proof" className="hover:text-ink">Proof</Link>
              <Link href="/how" className="hover:text-ink">How it works</Link>
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
