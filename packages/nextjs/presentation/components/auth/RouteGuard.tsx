/**
 * RouteGuard Component
 *
 * Protects routes based on authentication and authorization requirements.
 * Automatically redirects unauthorized users to appropriate pages.
 *
 * @example
 * ```tsx
 * // In a page that requires authentication
 * <RouteGuard requireAuth requireVerification>
 *   <PatientDashboard />
 * </RouteGuard>
 *
 * // In a page that requires specific roles
 * <RouteGuard
 *   requireAuth
 *   requireVerification
 *   allowedRoles={[UserRole.CLINIC, UserRole.ADMIN]}
 * >
 *   <ClinicDashboard />
 * </RouteGuard>
 * ```
 */

'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth, useRouteAccess } from '@/shared/hooks/useAuth';
import type { UserRole, Permission } from '@/shared/types/auth.types';

export interface RouteGuardProps {
  children: ReactNode;

  /** Require wallet connection */
  requireAuth?: boolean;

  /** Require Human Passport verification */
  requireVerification?: boolean;

  /** Allowed user roles (any of) */
  allowedRoles?: UserRole[];

  /** Required permissions (all of) */
  requiredPermissions?: Permission[];

  /** Custom redirect path */
  redirectTo?: string;

  /** Show loading state while checking */
  showLoading?: boolean;

  /** Show access denied message instead of redirecting */
  showAccessDenied?: boolean;
}

export function RouteGuard({
  children,
  requireAuth = false,
  requireVerification = false,
  allowedRoles = [],
  requiredPermissions = [],
  redirectTo,
  showLoading = true,
  showAccessDenied = false,
}: RouteGuardProps) {
  const router = useRouter();
  const auth = useAuth();

  // Check route access
  const { canAccess, reason, redirectTo: defaultRedirect } = useRouteAccess({
    requireAuth,
    requireVerification,
    allowedRoles,
    requiredPermissions,
  });

  // Handle redirect
  useEffect(() => {
    if (!auth.isLoading && !canAccess && !showAccessDenied) {
      const targetPath = redirectTo || defaultRedirect || '/';
      router.push(targetPath);
    }
  }, [auth.isLoading, canAccess, router, redirectTo, defaultRedirect, showAccessDenied]);

  // Show loading state
  if (auth.isLoading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking access...</p>
        </motion.div>
      </div>
    );
  }

  // Show access denied
  if (!canAccess && showAccessDenied) {
    return <AccessDeniedView reason={reason} />;
  }

  // Render children if authorized
  if (canAccess) {
    return <>{children}</>;
  }

  // Show nothing while redirecting
  return null;
}

/**
 * Access Denied View
 */
function AccessDeniedView({ reason }: { reason: string | null }) {
  const router = useRouter();

  const messages: Record<string, { title: string; description: string; action?: string; actionHref?: string }> = {
    not_connected: {
      title: 'Wallet Not Connected',
      description: 'Please connect your wallet to access this page.',
      action: 'Connect Wallet',
      actionHref: '/',
    },
    not_verified: {
      title: 'Verification Required',
      description: 'Please complete Human Passport verification to access this page.',
      action: 'Get Verified',
      actionHref: '/onboarding',
    },
    insufficient_role: {
      title: 'Access Denied',
      description: 'You don\'t have the required role to access this page.',
    },
    insufficient_permissions: {
      title: 'Insufficient Permissions',
      description: 'You don\'t have the required permissions to access this page.',
    },
  };

  const message = reason ? messages[reason] : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-8 text-center">
          <div className="rounded-full bg-destructive/20 p-4 w-fit mx-auto mb-6">
            {reason === 'not_connected' && <Lock className="h-12 w-12 text-destructive" />}
            {reason === 'not_verified' && <Shield className="h-12 w-12 text-destructive" />}
            {(reason === 'insufficient_role' || reason === 'insufficient_permissions') && (
              <AlertCircle className="h-12 w-12 text-destructive" />
            )}
            {!reason && <AlertCircle className="h-12 w-12 text-destructive" />}
          </div>

          <h2 className="text-2xl font-bold mb-3">
            {message?.title || 'Access Denied'}
          </h2>

          <p className="text-muted-foreground mb-6">
            {message?.description || 'You don\'t have permission to access this page.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {message?.action && message?.actionHref && (
              <button
                onClick={() => router.push(message.actionHref!)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                {message.action}
              </button>
            )}

            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium"
            >
              Go Home
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Higher-order component to protect a page
 */
export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  protection: Omit<RouteGuardProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <RouteGuard {...protection}>
        <Component {...props} />
      </RouteGuard>
    );
  };
}
