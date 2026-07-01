import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { CurrencyProvider } from "@/lib/currency";
import { CurrencySelector } from "@/components/CurrencySelector";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ElectroHub | Electronics Component & Circuit Intelligence",
  description: "Transforming unstructured electronic component data into an interconnected, intelligent, and instantly accessible ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-background text-foreground min-h-screen flex flex-col antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <CurrencyProvider>
            {/* Ambient Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[300px] bg-gradient-to-b from-blue-500/10 via-transparent to-transparent blur-[120px] pointer-events-none -z-10" />

          {/* Global Navigation Bar */}
          <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-black shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-all">
                  EH
                </div>
                <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Electro<span className="text-blue-500 font-bold">Hub</span>
                </span>
              </Link>

              {/* Nav Links */}
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                <Link
                  href="/search"
                  className="hover:text-foreground transition-colors py-1.5 px-3 rounded-md hover:bg-secondary/50"
                >
                  Explorer
                </Link>
                <Link
                  href="/circuits"
                  className="hover:text-foreground transition-colors py-1.5 px-3 rounded-md hover:bg-secondary/50"
                >
                  Circuits
                </Link>
                <Link
                  href="/bom"
                  className="hover:text-foreground transition-colors py-1.5 px-3 rounded-md hover:bg-secondary/50"
                >
                  BOM Optimizer
                </Link>
                <Link
                  href="/projects"
                  className="hover:text-foreground transition-colors py-1.5 px-3 rounded-md hover:bg-secondary/50"
                >
                  Workspace
                </Link>
                <Link
                  href="/admin"
                  className="hover:text-foreground transition-colors py-1.5 px-3 rounded-md hover:bg-secondary/50"
                >
                  Admin
                </Link>
              </nav>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <Link
                  href="/search"
                  className="hidden sm:inline-flex items-center gap-2 bg-secondary border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs px-3.5 py-1.5 rounded-md transition-all"
                >
                  Quick Search <kbd className="text-[10px] text-muted-foreground/60 bg-background px-1 py-0.5 rounded border border-border font-mono">⌘K</kbd>
                </Link>
                <CurrencySelector />
                <ThemeToggle />
                <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted transition-colors">
                  JD
                </div>
              </div>
            </div>
          </header>

          {/* Page Main Content */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>

            {/* Global Footer */}
            <footer className="border-t border-border bg-card text-muted-foreground py-8 text-xs">
              <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  &copy; 2026 ElectroHub Inc. All rights reserved.
                </div>
                <div className="flex items-center gap-6">
                  <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                  <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                  <a href="#" className="hover:text-foreground transition-colors">API Docs</a>
                  <a href="#" className="hover:text-foreground transition-colors">Status</a>
                </div>
              </div>
            </footer>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
