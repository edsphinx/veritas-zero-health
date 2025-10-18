'use client';

import Link from 'next/link';

export function AppFooter() {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              DASHI
            </h3>
            <p className="text-sm text-muted-foreground">
              Decentralized Anonymous Sovereign Health Identity
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/studies" className="hover:text-foreground transition-colors">
                  Browse Studies
                </Link>
              </li>
              <li>
                <Link href="/patient" className="hover:text-foreground transition-colors">
                  Patient Portal
                </Link>
              </li>
              <li>
                <Link href="/researcher" className="hover:text-foreground transition-colors">
                  Researcher Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Technology</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Zero-Knowledge Proofs</li>
              <li>Encrypted Storage</li>
              <li>Human Verification</li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Veritas Zero Health. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
