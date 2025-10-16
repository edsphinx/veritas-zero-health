/**
 * SuperAdmin Analytics Page
 *
 * View platform-wide analytics and metrics
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  DollarSign,
  Beaker,
  FileText,
  ArrowUp,
  ArrowDown,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout';
import { isSuperAdmin } from '@/shared/lib/auth/superadmin';

interface MetricCard {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'accent' | 'warning';
}

const METRICS: MetricCard[] = [
  {
    label: 'Total Users',
    value: '2,847',
    change: 12.5,
    trend: 'up',
    icon: <Users className="h-6 w-6" />,
    color: 'primary',
  },
  {
    label: 'Active Studies',
    value: '34',
    change: 8.2,
    trend: 'up',
    icon: <Beaker className="h-6 w-6" />,
    color: 'success',
  },
  {
    label: 'Total Volume',
    value: '$124.5K',
    change: 23.1,
    trend: 'up',
    icon: <DollarSign className="h-6 w-6" />,
    color: 'accent',
  },
  {
    label: 'Verifications',
    value: '1,234',
    change: 5.3,
    trend: 'down',
    icon: <Activity className="h-6 w-6" />,
    color: 'warning',
  },
];

interface TimeSeriesData {
  date: string;
  users: number;
  studies: number;
  transactions: number;
}

const WEEKLY_DATA: TimeSeriesData[] = [
  { date: '2025-10-07', users: 2650, studies: 28, transactions: 145 },
  { date: '2025-10-08', users: 2698, studies: 29, transactions: 162 },
  { date: '2025-10-09', users: 2734, studies: 30, transactions: 178 },
  { date: '2025-10-10', users: 2768, studies: 31, transactions: 189 },
  { date: '2025-10-11', users: 2795, studies: 32, transactions: 201 },
  { date: '2025-10-12', users: 2821, studies: 33, transactions: 215 },
  { date: '2025-10-13', users: 2847, studies: 34, transactions: 228 },
];

export default function AnalyticsPage() {
  const { address } = useAccount();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  if (!isSuperAdmin(address)) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              SuperAdmin privileges required to view analytics.
            </p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-success" />
              Platform Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor platform performance and user metrics
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === '7d'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === '30d'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === '90d'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICS.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MetricCardComponent {...metric} />
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <ChartCard
            title="User Growth"
            description="Total registered users over time"
            icon={<Users className="h-5 w-5" />}
          >
            <SimpleLineChart
              data={WEEKLY_DATA}
              dataKey="users"
              color="primary"
              label="Users"
            />
          </ChartCard>

          {/* Study Activity */}
          <ChartCard
            title="Study Activity"
            description="Active clinical trials"
            icon={<Beaker className="h-5 w-5" />}
          >
            <SimpleLineChart
              data={WEEKLY_DATA}
              dataKey="studies"
              color="success"
              label="Studies"
            />
          </ChartCard>

          {/* Transaction Volume */}
          <ChartCard
            title="Transaction Volume"
            description="On-chain transactions per day"
            icon={<Activity className="h-5 w-5" />}
          >
            <SimpleBarChart
              data={WEEKLY_DATA}
              dataKey="transactions"
              color="accent"
              label="Transactions"
            />
          </ChartCard>

          {/* User Distribution */}
          <ChartCard
            title="User Distribution"
            description="Users by role"
            icon={<Users className="h-5 w-5" />}
          >
            <UserDistribution />
          </ChartCard>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            <ActivityItem
              icon={<Users className="h-4 w-4" />}
              text="23 new users registered"
              time="2 hours ago"
              type="success"
            />
            <ActivityItem
              icon={<Beaker className="h-4 w-4" />}
              text="New study 'Diabetes Prevention Trial' created"
              time="5 hours ago"
              type="primary"
            />
            <ActivityItem
              icon={<DollarSign className="h-4 w-4" />}
              text="$5,200 deposited to study escrow"
              time="8 hours ago"
              type="accent"
            />
            <ActivityItem
              icon={<Activity className="h-4 w-4" />}
              text="142 ZK proofs verified"
              time="12 hours ago"
              type="success"
            />
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

function MetricCardComponent({ label, value, change, trend, icon, color }: MetricCard) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    accent: 'bg-accent/10 text-accent',
    warning: 'bg-warning/10 text-warning',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${
            trend === 'up' ? 'text-success' : 'text-destructive'
          }`}
        >
          {trend === 'up' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
          {change}%
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      {children}
    </div>
  );
}

function SimpleLineChart({
  data,
  dataKey,
  color,
  label,
}: {
  data: TimeSeriesData[];
  dataKey: keyof TimeSeriesData;
  color: 'primary' | 'success' | 'accent';
  label: string;
}) {
  const values = data.map((d) => Number(d[dataKey]));
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  const colorClasses = {
    primary: 'stroke-primary',
    success: 'stroke-success',
    accent: 'stroke-accent',
  };

  return (
    <div className="h-48">
      <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className={colorClasses[color]}
          points={data
            .map((d, i) => {
              const x = (i / (data.length - 1)) * 700;
              const y = 200 - ((Number(d[dataKey]) - min) / range) * 180 - 10;
              return `${x},${y}`;
            })
            .join(' ')}
        />
      </svg>
      <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
        <span>{data[0].date}</span>
        <span className="font-semibold">{label}</span>
        <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  );
}

function SimpleBarChart({
  data,
  dataKey,
  color,
  label,
}: {
  data: TimeSeriesData[];
  dataKey: keyof TimeSeriesData;
  color: 'primary' | 'success' | 'accent';
  label: string;
}) {
  const values = data.map((d) => Number(d[dataKey]));
  const max = Math.max(...values);

  const colorClasses = {
    primary: 'fill-primary',
    success: 'fill-success',
    accent: 'fill-accent',
  };

  return (
    <div className="h-48">
      <svg className="w-full h-full" viewBox="0 0 700 200">
        {data.map((d, i) => {
          const barWidth = 700 / data.length - 10;
          const x = (i / data.length) * 700 + 5;
          const height = (Number(d[dataKey]) / max) * 180;
          const y = 200 - height;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={height}
              className={`${colorClasses[color]} opacity-80 hover:opacity-100 transition-opacity`}
              rx="4"
            />
          );
        })}
      </svg>
      <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
        <span>{data[0].date}</span>
        <span className="font-semibold">{label}</span>
        <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  );
}

function UserDistribution() {
  const distribution = [
    { role: 'Patients', count: 2234, color: 'bg-primary', percentage: 78 },
    { role: 'Clinics', count: 312, color: 'bg-accent', percentage: 11 },
    { role: 'Researchers', count: 289, color: 'bg-success', percentage: 10 },
    { role: 'Admins', count: 12, color: 'bg-warning', percentage: 1 },
  ];

  return (
    <div className="space-y-4">
      {distribution.map((item) => (
        <div key={item.role}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{item.role}</span>
            <span className="text-sm text-muted-foreground">
              {item.count} ({item.percentage}%)
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`${item.color} h-2 rounded-full transition-all`}
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityItem({
  icon,
  text,
  time,
  type,
}: {
  icon: React.ReactNode;
  text: string;
  time: string;
  type: 'primary' | 'success' | 'accent';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    accent: 'bg-accent/10 text-accent',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-lg ${colorClasses[type]}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium">{text}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
