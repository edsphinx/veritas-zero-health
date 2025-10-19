'use client';

import Link from 'next/link';
import Image from 'next/image';
import { WalletButton, NetworkSwitcher } from '@/components/wallet';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/dashi-logo.svg"
            alt="DASHI"
            width={40}
            height={40}
            className="w-10 h-10"
          />
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

        <div className="flex items-center space-x-3">
          <NetworkSwitcher />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
