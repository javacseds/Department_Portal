'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Users, Building2, Calendar, FileText, Activity, 
  Database, Trophy, Clock, FileSpreadsheet, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(8).fill(null).map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.data?.stats || {};
  const recentActivity = data?.data?.recentActivity || [];

  const statCards = [
    { title: 'Total Faculty', value: stats.faculty || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Total Students', value: stats.students || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { title: 'Departments', value: stats.departments || 0, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Achievements', value: stats.achievements || 0, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { title: 'Events Hosted', value: stats.events || 0, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { title: 'Pending Approvals', value: stats.pendingApprovals || 0, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
    { title: 'Files Uploaded', value: stats.files || 0, icon: FileText, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    { title: 'Storage Used', value: `${stats.storageUsedMB || 0} MB`, icon: Database, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display">
          Institution Overview
        </h1>
        <p className="text-slate-500 mt-1">Welcome to the central department automation system.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={idx} 
            className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-500" /> Quick Actions
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/approvals" className="group card p-5 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-l-4 border-l-amber-500">
              <h3 className="font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> Review Approvals
              </h3>
              <p className="text-sm text-slate-500 mt-2">You have {stats.pendingApprovals || 0} pending workflows requiring attention.</p>
            </Link>
            
            <Link href="/reports" className="group card p-5 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-l-4 border-l-emerald-500">
              <h3 className="font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" /> Export Reports
              </h3>
              <p className="text-sm text-slate-500 mt-2">Generate NAAC/NBA formatted compliance data easily.</p>
            </Link>

            <Link href="/events" className="group card p-5 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-l-4 border-l-blue-500">
              <h3 className="font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" /> Schedule Event
              </h3>
              <p className="text-sm text-slate-500 mt-2">Plan and request budget for a new institutional program.</p>
            </Link>

            <Link href="/achievements" className="group card p-5 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-l-4 border-l-purple-500">
              <h3 className="font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-500" /> Log Achievement
              </h3>
              <p className="text-sm text-slate-500 mt-2">Record a new patent, publication, or award for the ledger.</p>
            </Link>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold font-display">System Activity</h2>
          </div>
          <div className="p-6 flex-1 overflow-y-auto max-h-[400px]">
            {recentActivity.length === 0 ? (
              <p className="text-center text-slate-500 text-sm mt-10">No recent activity</p>
            ) : (
              <div className="space-y-6">
                {recentActivity.map((activity: any, i: number) => (
                  <div key={activity.id} className="flex gap-4 relative">
                    {i !== recentActivity.length - 1 && (
                      <div className="absolute left-4 top-10 bottom-[-24px] w-0.5 bg-slate-100 dark:bg-slate-800"></div>
                    )}
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center shrink-0 z-10 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                      {activity.user ? activity.user.firstName[0] + activity.user.lastName[0] : 'SYS'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System'} 
                        <span className="text-slate-500 font-normal ml-1">
                          {activity.action.toLowerCase()}d a {activity.entity.toLowerCase()}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl text-center">
            <Link href="/audit-logs" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1">
              View full audit log <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
