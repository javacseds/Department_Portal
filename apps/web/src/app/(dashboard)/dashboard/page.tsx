'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Building2, Users, GraduationCap, CalendarDays, FileText,
  FolderOpen, GitPullRequest, HardDrive, TrendingUp, TrendingDown,
  ArrowUpRight, Clock, CheckCircle2, AlertCircle, Plus, Download,
  Upload, Eye, Zap,
} from 'lucide-react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { setBreadcrumbs, setPageTitle } from '@/lib/store/slices/uiSlice';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import clsx from 'clsx';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

interface DashboardStats {
  stats: {
    departments: number;
    faculty: number;
    students: number;
    events: number;
    documents: number;
    pendingApprovals: number;
    files: number;
    storageUsedMB: number;
  };
  charts: {
    monthlyDocuments: { month: string; count: number }[];
    eventsByType: { type: string; count: number }[];
    documentsByType: { type: string; count: number }[];
  };
  recentActivity: {
    id: string;
    action: string;
    description: string;
    createdAt: string;
    user: { firstName: string; lastName: string; role: string } | null;
  }[];
}

const statCards = [
  { key: 'departments', label: 'Departments', icon: Building2, color: 'from-blue-500 to-blue-600', href: '/departments', trend: '+2 this year' },
  { key: 'faculty', label: 'Faculty', icon: Users, color: 'from-violet-500 to-violet-600', href: '/faculty', trend: '+5 this semester' },
  { key: 'students', label: 'Students', icon: GraduationCap, color: 'from-emerald-500 to-emerald-600', href: '/students', trend: '+120 this year' },
  { key: 'events', label: 'Events', icon: CalendarDays, color: 'from-orange-500 to-orange-600', href: '/events', trend: '+8 this month' },
  { key: 'documents', label: 'Documents', icon: FileText, color: 'from-pink-500 to-pink-600', href: '/documents', trend: 'Generated this month' },
  { key: 'pendingApprovals', label: 'Pending Approvals', icon: GitPullRequest, color: 'from-red-500 to-red-600', href: '/approvals', trend: 'Needs attention', alert: true },
  { key: 'files', label: 'Files Uploaded', icon: FolderOpen, color: 'from-cyan-500 to-cyan-600', href: '/file-manager', trend: 'Total files' },
  { key: 'storageUsedMB', label: 'Storage Used', icon: HardDrive, color: 'from-slate-500 to-slate-600', href: '/settings', trend: 'MB used', suffix: ' MB' },
] as const;

function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton h-4 w-24 mb-3" />
      <div className="skeleton h-10 w-16 mb-2" />
      <div className="skeleton h-3 w-32" />
    </div>
  );
}

function ActivityItem({ item }: { item: DashboardStats['recentActivity'][0] }) {
  const actionColor: Record<string, string> = {
    LOGIN: 'bg-emerald-500',
    LOGOUT: 'bg-slate-400',
    CREATE: 'bg-blue-500',
    UPDATE: 'bg-amber-500',
    DELETE: 'bg-red-500',
    DOWNLOAD: 'bg-cyan-500',
    UPLOAD: 'bg-violet-500',
    LOGIN_FAILED: 'bg-red-400',
  };

  const color = actionColor[item.action] || 'bg-slate-400';

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className={clsx('w-2 h-2 rounded-full mt-2 shrink-0', color)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{item.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">
            {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System'}
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-xs text-slate-400">
            {new Date(item.createdAt).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>
      </div>
      <span className={clsx('badge text-white shrink-0', color)}>
        {item.action}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);

  useEffect(() => {
    dispatch(setPageTitle('Dashboard'));
    dispatch(setBreadcrumbs([{ label: 'Dashboard' }]));
  }, [dispatch]);

  const { data, isLoading } = useQuery<{ data: DashboardStats }>({
    queryKey: ['dashboard-stats'],
    queryFn: () =>
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      }).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const stats = data?.data?.stats;
  const charts = data?.data?.charts;
  const activity = data?.data?.recentActivity || [];

  // Chart configs
  const lineChartData = {
    labels: charts?.monthlyDocuments?.map((d) => d.month) || [],
    datasets: [{
      label: 'Documents Generated',
      data: charts?.monthlyDocuments?.map((d) => d.count) || [],
      borderColor: '#6366F1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6366F1',
      pointRadius: 4,
    }],
  };

  const doughnutData = {
    labels: charts?.documentsByType?.map((d) => d.type) || [],
    datasets: [{
      data: charts?.documentsByType?.map((d) => d.count) || [1],
      backgroundColor: ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B'],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
    },
  };

  const quickActions = [
    { label: 'New Document', icon: Plus, href: '/documents?action=new', color: 'bg-primary-600' },
    { label: 'Upload File', icon: Upload, href: '/file-manager?action=upload', color: 'bg-violet-600' },
    { label: 'Add Event', icon: CalendarDays, href: '/events?action=new', color: 'bg-emerald-600' },
    { label: 'Generate Report', icon: Download, href: '/reports?action=new', color: 'bg-orange-600' },
    { label: 'View Approvals', icon: GitPullRequest, href: '/approvals', color: 'bg-red-600' },
    { label: 'File Manager', icon: FolderOpen, href: '/file-manager', color: 'bg-cyan-600' },
  ];

  return (
    <div className="space-y-8">
      {/* ── Welcome Banner ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 lg:p-8"
        style={{
          background: 'linear-gradient(135deg, #4338CA 0%, #6D28D9 50%, #7C3AED 100%)',
          boxShadow: '0 8px 40px rgba(99, 102, 241, 0.3)',
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full -mb-10" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-2xl lg:text-3xl font-black text-white font-display">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
              {user?.firstName}! 👋
            </h1>
            <p className="text-white/70 mt-1.5 text-sm">
              {user?.college?.name} — {user?.role?.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/documents?action=new" className="btn bg-white text-primary-700 hover:bg-white/90 font-semibold shadow-lg">
              <Plus className="w-4 h-4" />
              New Document
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Grid ────────────────────────────────── */}
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {isLoading
          ? Array(8).fill(null).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card) => {
              const value = stats?.[card.key as keyof typeof stats] ?? 0;
              return (
                <motion.div key={card.key} variants={stagger.item}>
                  <Link href={card.href} className="block">
                    <div className={clsx('stat-card group cursor-pointer', card.alert && value > 0 && 'ring-2 ring-red-400/50')}>
                      <div className="flex items-start justify-between mb-4">
                        <div className={clsx(
                          'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
                          card.color
                        )}>
                          <card.icon className="w-5 h-5 text-white" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-primary-500 transition-colors" />
                      </div>
                      <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                        {card.suffix || ''}
                      </div>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">{card.label}</p>
                      <p className={clsx(
                        'text-xs mt-1.5 flex items-center gap-1',
                        card.alert && value > 0 ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'
                      )}>
                        {card.alert && value > 0 ? <AlertCircle className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 text-emerald-500" />}
                        {card.trend}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
      </motion.div>

      {/* ── Charts Row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Document Generation Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 6 months</p>
            </div>
            <span className="badge badge-primary">
              <TrendingUp className="w-3 h-3" /> Monthly
            </span>
          </div>
          <div className="h-56">
            <Line data={lineChartData} options={chartOptions as any} />
          </div>
        </motion.div>

        {/* Doughnut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white">Documents by Type</h3>
            <p className="text-xs text-slate-500 mt-0.5">Breakdown</p>
          </div>
          <div className="h-44 flex items-center justify-center">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
                cutout: '65%',
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* ── Quick Actions + Activity ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                id={`quick-action-${action.label.toLowerCase().replace(/\s/g, '-')}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all group cursor-pointer"
              >
                <div className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform',
                  action.color
                )}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 text-center leading-tight">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Recent Activity
            </h3>
            <Link href="/activity-logs" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-0">
            {isLoading ? (
              Array(5).fill(null).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="skeleton w-2 h-2 rounded-full shrink-0" />
                  <div className="skeleton h-4 flex-1" />
                </div>
              ))
            ) : activity.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-600">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              activity.map((item) => <ActivityItem key={item.id} item={item} />)
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
