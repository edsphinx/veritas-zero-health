/**
 * StatCard Component
 *
 * Reusable stat display card for researcher dashboards
 * Consolidated from multiple duplicate definitions
 */

'use client';

import { Card, CardHeader, CardContent, CardDescription } from '@/components/ui/card';

/**
 * Available color variants for StatCard
 */
export type StatCardColor =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'green'
  | 'blue'
  | 'purple'
  | 'orange';

/**
 * StatCard Props
 */
export interface StatCardProps {
  /** Icon element to display */
  icon: React.ReactNode;
  /** Card title (optional, for Card-style stats) */
  title?: string;
  /** Stat label */
  label: string;
  /** Stat value (string or number) */
  value: string | number;
  /** Color variant */
  color: StatCardColor;
  /** Optional description */
  description?: string;
}

/**
 * Centralized color class mappings
 */
const getColorClasses = (color: StatCardColor) => {
  const variants = {
    // Theme colors
    primary: {
      card: 'border-primary/20 bg-primary/5',
      icon: 'text-primary',
      label: 'text-primary',
      value: 'text-primary',
    },
    secondary: {
      card: 'border-secondary/20 bg-secondary/5',
      icon: 'text-secondary',
      label: 'text-secondary',
      value: 'text-secondary',
    },
    accent: {
      card: 'border-accent/20 bg-accent/5',
      icon: 'text-accent',
      label: 'text-accent',
      value: 'text-accent',
    },
    // Semantic colors
    green: {
      card: 'bg-green-50',
      icon: 'text-green-600',
      label: 'text-green-600',
      value: 'text-green-900',
    },
    blue: {
      card: 'bg-blue-50',
      icon: 'text-blue-600',
      label: 'text-blue-600',
      value: 'text-blue-900',
    },
    purple: {
      card: 'bg-purple-50',
      icon: 'text-purple-600',
      label: 'text-purple-600',
      value: 'text-purple-900',
    },
    orange: {
      card: 'bg-orange-50',
      icon: 'text-orange-600',
      label: 'text-orange-600',
      value: 'text-orange-900',
    },
  };

  return variants[color];
};

/**
 * StatCard Component
 *
 * @example
 * ```tsx
 * <StatCard
 *   icon={<DollarSign className="h-5 w-5" />}
 *   label="Total Funding"
 *   value="$1,000 USDC"
 *   color="green"
 * />
 * ```
 */
export function StatCard({
  icon,
  title,
  label,
  value,
  color,
  description,
}: StatCardProps) {
  const classes = getColorClasses(color);

  // Card-style variant (with title)
  if (title) {
    return (
      <Card className={classes.card}>
        <CardHeader className="pb-2">
          <CardDescription>{title}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className={`text-4xl font-bold ${classes.value}`}>{value}</p>
        </CardContent>
      </Card>
    );
  }

  // Compact variant (default)
  return (
    <div className={`${classes.card} rounded-lg p-4`}>
      <div className={`${classes.icon} mb-2`}>{icon}</div>
      <p className={`text-sm ${classes.label} mb-1`}>{label}</p>
      <p className={`text-2xl font-bold ${classes.value}`}>{value}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
