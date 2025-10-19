/**
 * QuickActionCard Component
 *
 * Interactive card for quick actions in researcher dashboard
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { listItemVariants } from '@/lib/animations';

export interface QuickActionCardProps {
  /** Icon element */
  icon: React.ReactNode;
  /** Action title */
  title: string;
  /** Action description */
  description: string;
  /** Link destination */
  href: string;
}

/**
 * QuickActionCard Component
 *
 * @example
 * ```tsx
 * <QuickActionCard
 *   icon={<Plus className="h-6 w-6" />}
 *   title="New Study"
 *   description="Create clinical trial"
 *   href="/researcher/create-study"
 * />
 * ```
 */
export function QuickActionCard({
  icon,
  title,
  description,
  href,
}: QuickActionCardProps) {
  return (
    <motion.div variants={listItemVariants}>
      <Link href={href} className="block group">
        <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
          <CardContent className="pt-6">
            <div className="rounded-lg bg-primary/10 w-fit p-3 mb-3 text-primary">
              {icon}
            </div>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-2">{description}</p>
            <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
