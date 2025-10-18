'use client';

import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            DASHI
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/studies"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Studies
          </Link>
          <Link
            href="/patient"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Patient
          </Link>
          <Link
            href="/researcher"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Researcher
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <appkit-button />
        </div>
      </div>
    </header>
  );
}
