/**
 * DashboardSidebar Component
 *
 * Collapsible sidebar for dashboard layouts (Patient, Clinic, Researcher, Admin).
 * Implements the hybrid approach: Top nav + optional sidebar for complex dashboards.
 *
 * Features:
 * - Fully responsive (collapses to icons on small screens)
 * - Smooth animations
 * - Role-based navigation
 * - Active state indicators
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { getNavigationForRole } from '@/config/navigation.config';
import type { NavItem } from '@/shared/types/auth.types';
import { cn } from '@/shared/lib/utils';

export interface DashboardSidebarProps {
  /** Initial collapse state */
  defaultCollapsed?: boolean;

  /** Show sidebar on mobile by default */
  showMobileByDefault?: boolean;
}

export function DashboardSidebar({
  defaultCollapsed = false,
  showMobileByDefault = false,
}: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(showMobileByDefault);
  const pathname = usePathname();
  const auth = useAuth();

  // Get navigation items for current role
  const navigation = getNavigationForRole(auth.role);

  // Filter accessible navigation items
  const accessibleNav = navigation.filter((item) => {
    if (item.roles && !auth.hasRole(item.roles)) return false;
    if (item.permissions && !auth.hasAllPermissions(item.permissions)) return false;
    return true;
  });

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Save collapse preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
    }
  }, [isCollapsed]);

  // Load collapse preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved) {
        setIsCollapsed(saved === 'true');
      }
    }
  }, []);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? '5rem' : '16rem',
        }}
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-card h-[calc(100vh-4rem)] sticky top-16',
          'transition-all duration-300 ease-in-out'
        )}
      >
        {/* Collapse Toggle */}
        <div className="p-4 border-b border-border flex justify-end">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {accessibleNav.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              pathname={pathname}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 border-t border-border text-xs text-muted-foreground"
          >
            <p className="mb-1 font-medium">Veritas Zero Health</p>
            <p>Version 1.0.0</p>
          </motion.div>
        )}
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-xl overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {accessibleNav.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    isCollapsed={false}
                    onClick={() => setIsMobileOpen(false)}
                  />
                ))}
              </nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Sidebar Item Component
 */
interface SidebarItemProps {
  item: NavItem;
  pathname: string;
  isCollapsed: boolean;
  onClick?: () => void;
}

function SidebarItem({ item, pathname, isCollapsed, onClick }: SidebarItemProps) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon ? (LucideIcons as any)[item.icon] : null;

  // If item has children, render as expandable
  if (item.children && item.children.length > 0) {
    return (
      <ExpandableItem
        item={item}
        pathname={pathname}
        isCollapsed={isCollapsed}
        onClick={onClick}
      />
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        isCollapsed && 'justify-center px-2'
      )}
      title={isCollapsed ? item.label : undefined}
    >
      {Icon && (
        <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary-foreground')} />
      )}

      {!isCollapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-accent text-accent-foreground rounded">
              {item.badge}
            </span>
          )}
        </>
      )}

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
          {item.label}
        </div>
      )}
    </Link>
  );
}

/**
 * Expandable Sidebar Item (with children)
 */
function ExpandableItem({
  item,
  pathname,
  isCollapsed,
  onClick,
}: SidebarItemProps) {
  const [isExpanded, setIsExpanded] = useState(
    item.children?.some((child) => pathname.startsWith(child.href)) || false
  );
  const Icon = item.icon ? (LucideIcons as any)[item.icon] : null;
  const isActive = pathname === item.href || item.children?.some((child) => pathname === child.href);

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent',
          isCollapsed && 'justify-center px-2'
        )}
        title={isCollapsed ? item.label : undefined}
      >
        {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </>
        )}
      </button>

      {/* Children */}
      {!isCollapsed && (
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-6 mt-1 space-y-1">
                {item.children?.map((child) => {
                  const isChildActive = pathname === child.href;
                  const ChildIcon = child.icon ? (LucideIcons as any)[child.icon] : null;

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onClick}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        isChildActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      {ChildIcon && <ChildIcon className="h-4 w-4 flex-shrink-0" />}
                      <span>{child.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
