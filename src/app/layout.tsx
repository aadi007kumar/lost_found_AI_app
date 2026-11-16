import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reunite · Lost & Found India",
  description: "Report what you lost or found anywhere in India. AI finds likely matches.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
          <Link href="/" className="font-serif text-xl tracking-tight">
            Reunite
          </Link>
          <nav className="flex gap-5 text-sm text-muted">
            <Link href="/report?type=lost" className="transition-colors duration-150 hover:text-fg">
              Report lost
            </Link>
            <Link href="/report?type=found" className="transition-colors duration-150 hover:text-fg">
              Report found
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-5 py-10 text-xs text-muted">
          Matches are suggestions. Before handing anything over, ask the other person to describe it.
        </footer>
      </body>
    </html>
  );
}
