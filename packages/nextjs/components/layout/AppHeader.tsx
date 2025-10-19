/**
 * AppHeader Component
 *
 * Unified header with responsive navigation and role-based links
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { WalletButton, NetworkSwitcher } from '@/components/wallet';
import { useAuth } from '@/hooks/useAuth';
import { getNavigationForRole } from '@/config/navigation.config';
import type { NavItem } from '@/config/navigation.config';
import { cn } from '@/lib/utils';
import { mobileMenuVariants, transitions } from '@/lib/animations';

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const auth = useAuth();

  // Get navigation items for current role
  const navigation = getNavigationForRole(auth.user?.role || null);

  // For authenticated users, filter to show only dashboard link in header
  const headerNav = auth.isAuthenticated
    ? navigation.filter((item) => {
        // Only show Dashboard links (portal root paths)
        return (
          item.href === '/patient' ||
          item.href === '/clinic' ||
          item.href === '/researcher' ||
          item.href === '/sponsor' ||
          item.href === '/superadmin'
        );
      })
    : navigation;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="rounded-lg bg-gradient-to-br from-primary to-secondary p-2">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="hidden sm:inline-block font-bold text-lg bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent group-hover:from-primary group-hover:to-secondary transition-all">
                DASHI
              </span>
              <span className="hidden md:inline-block text-xs text-muted-foreground font-normal ml-1">
                Health Identity
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {headerNav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Network Selector */}
            <NetworkSwitcher />

            {/* Wallet Connect Button */}
            <WalletButton />

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-accent transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <MobileMenu
              navigation={headerNav}
              pathname={pathname}
              onClose={() => setMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

/**
 * Navigation Link Component
 */
function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = item.icon ? (LucideIcons as any)[item.icon] : null;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
        isActive
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground rounded">
          {item.badge}
        </span>
      )}
      {isActive && (
        <motion.div
          layoutId="navbar-indicator"
          className="absolute inset-0 bg-primary/10 rounded-lg"
          style={{ zIndex: -1 }}
          transition={transitions.spring}
        />
      )}
    </Link>
  );
}

/**
 * Mobile Menu
 */
function MobileMenu({
  navigation,
  pathname,
  onClose,
}: {
  navigation: NavItem[];
  pathname: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      variants={mobileMenuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={transitions.standard}
      className="lg:hidden border-t border-border"
    >
      <div className="py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Icon = item.icon ? (LucideIcons as any)[item.icon] : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
