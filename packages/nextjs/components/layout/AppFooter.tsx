/**
 * AppFooter Component
 *
 * Unified footer for all pages
 */

'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { footerNavigation } from '@/config/navigation.config';

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-gradient-to-br from-primary to-secondary p-2">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">DASHI</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Decentralized Anonymous Sovereign Health Identity. Own your health data, prove without revealing.
            </p>
            <p className="text-xs text-muted-foreground">
              © {currentYear} DASHI Protocol.
              <br />
              All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/trials"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse Trials
                </Link>
              </li>
              <li>
                <Link
                  href="/onboarding"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Get Started
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Resources</h3>
            <ul className="space-y-2">
              {footerNavigation.slice(0, 4).map((item) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const IconComponent = item.icon ? (LucideIcons as any)[item.icon] : null;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Community</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/veritas-zero-health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LucideIcons.Github className="h-3.5 w-3.5" />
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/veritaszero"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LucideIcons.Twitter className="h-3.5 w-3.5" />
                  <span>Twitter</span>
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/veritaszero"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LucideIcons.MessageCircle className="h-3.5 w-3.5" />
                  <span>Discord</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            Built with privacy, transparency, and trust.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/cookies"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
