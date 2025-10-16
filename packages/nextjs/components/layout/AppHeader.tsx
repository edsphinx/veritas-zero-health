/**
 * AppHeader Component
 *
 * Unified header with responsive navigation.
 * Works across all portals and screen sizes.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  Bell,
  Sparkles,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { WalletConnectCompact } from '@/components/wallet/WalletConnect';
import { NetworkSelector } from '@/components/NetworkSelector';
import { useAuth } from '@/shared/hooks/useAuth';
import { getNavigationForRole, portalNavigation } from '@/config/navigation.config';
import type { NavItem } from '@/shared/types/auth.types';
import { cn } from '@/shared/lib/utils';

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);

  const pathname = usePathname();
  const auth = useAuth();

  // Get navigation items for current role
  const navigation = getNavigationForRole(auth.role);

  // Only show Dashboard link in header (rest is in sidebar)
  // Filter to get only the Dashboard item for authenticated users
  const headerNav = auth.isAuthenticated
    ? navigation.filter((item) => {
        // Only show Dashboard item in header (portal root paths)
        if (!item.href.endsWith('/patient') &&
            !item.href.endsWith('/clinic') &&
            !item.href.endsWith('/researcher') &&
            !item.href.endsWith('/sponsor') &&
            !item.href.endsWith('/admin') &&
            !item.href.endsWith('/superadmin')) {
          return false;
        }
        if (item.roles && !auth.hasRole(item.roles)) return false;
        if (item.permissions && !auth.hasAllPermissions(item.permissions)) return false;
        return true;
      })
    : navigation.filter((item) => {
        // For guests, show main navigation
        if (item.roles && !auth.hasRole(item.roles)) return false;
        if (item.permissions && !auth.hasAllPermissions(item.permissions)) return false;
        return true;
      });

  // Filter accessible portals
  const accessiblePortals = portalNavigation.filter((portal) => {
    if (portal.roles && !auth.hasRole(portal.roles)) return false;
    return true;
  });

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

            {/* Desktop Navigation - Only Dashboard link */}
            <div className="hidden lg:flex items-center gap-1">
              {headerNav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Portal Switcher (if user has multiple roles) */}
            {auth.isAuthenticated && accessiblePortals.length > 1 && (
              <div className="hidden md:block relative">
                <button
                  onClick={() => setPortalMenuOpen(!portalMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                >
                  <span>{getRoleLabel(auth.role)}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                <AnimatePresence>
                  {portalMenuOpen && (
                    <PortalMenu
                      portals={accessiblePortals}
                      onClose={() => setPortalMenuOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Notifications (if authenticated) */}
            {auth.isAuthenticated && (
              <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-accent transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
              </button>
            )}

            {/* Network Selector */}
            <NetworkSelector />

            {/* Wallet Connect Button */}
            <WalletConnectCompact />

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-accent transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
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
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
    </Link>
  );
}

/**
 * Portal Switcher Menu
 */
function PortalMenu({
  portals,
  onClose,
}: {
  portals: NavItem[];
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-lg overflow-hidden"
      onMouseLeave={onClose}
    >
      <div className="p-2">
        {portals.map((portal) => {
          const Icon = portal.icon ? (LucideIcons as any)[portal.icon] : null;
          return (
            <Link
              key={portal.href}
              href={portal.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{portal.label}</span>
            </Link>
          );
        })}
      </div>
    </motion.div>
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
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="lg:hidden border-t border-border"
    >
      <div className="py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
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

/**
 * Helper: Get role display label
 */
function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    'patient': 'Patient',
    'clinic': 'Clinic',
    'researcher': 'Researcher',
    'sponsor': 'Sponsor',
    'admin': 'Administrator',
    'superadmin': 'SuperAdmin',
    'guest': 'Guest',
  };
  return labels[role] || 'Guest';
}
