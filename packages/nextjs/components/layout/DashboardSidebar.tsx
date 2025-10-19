/**
 * DashboardSidebar Component
 *
 * Collapsible sidebar with role-based navigation
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getNavigationForRole } from '@/config/navigation.config';
import type { NavItem } from '@/config/navigation.config';
import { cn } from '@/lib/utils';
import { slideRightVariants, fadeVariants, transitions } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface DashboardSidebarProps {
  defaultCollapsed?: boolean;
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
  const navigation = getNavigationForRole(auth.user?.role || null);

  // Persist collapse state in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
  }, [isCollapsed]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? '4rem' : '16rem',
        }}
        transition={transitions.spring}
        className="hidden lg:flex flex-col border-r border-border bg-background h-[calc(100vh-4rem)] sticky top-16"
      >
        <div className="flex-1 overflow-y-auto py-4 px-2">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                isCollapsed={isCollapsed}
                pathname={pathname}
              />
            ))}
          </nav>
        </div>

        <Separator />

        {/* Collapse Toggle */}
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full justify-between"
          >
            {!isCollapsed && <span className="text-xs">Collapse</span>}
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4 ml-auto" />
            )}
          </Button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={transitions.fast}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Sidebar */}
            <motion.aside
              variants={slideRightVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={transitions.standard}
              className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-semibold">Menu</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-2">
                <nav className="space-y-1">
                  {navigation.map((item) => (
                    <SidebarItem
                      key={item.href}
                      item={item}
                      isCollapsed={false}
                      pathname={pathname}
                      onClick={() => setIsMobileOpen(false)}
                    />
                  ))}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Menu Button (floating) */}
      <Button
        variant="default"
        size="sm"
        className="fixed bottom-4 right-4 lg:hidden z-30 rounded-full h-12 w-12 p-0 shadow-lg"
        onClick={() => setIsMobileOpen(true)}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </>
  );
}

/**
 * Sidebar Item Component
 */
function SidebarItem({
  item,
  isCollapsed,
  pathname,
  onClick,
}: {
  item: NavItem;
  isCollapsed: boolean;
  pathname: string;
  onClick?: () => void;
}) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = item.icon ? (LucideIcons as any)[item.icon] : null;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative group',
        isActive
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
      title={isCollapsed ? item.label : undefined}
    >
      {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}

      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground rounded">
              {item.badge}
            </span>
          )}
        </>
      )}

      {isActive && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute inset-0 bg-primary/10 rounded-lg"
          style={{ zIndex: -1 }}
          transition={transitions.spring}
        />
      )}

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {item.label}
          {item.badge && (
            <span className="ml-1 px-1 py-0.5 text-[9px] font-semibold bg-primary text-primary-foreground rounded">
              {item.badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
