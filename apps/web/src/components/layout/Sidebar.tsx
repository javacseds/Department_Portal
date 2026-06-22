'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { toggleSidebar, setSidebarMobileOpen } from '@/lib/store/slices/uiSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Building2, Users, GraduationCap, UserSquare2,
  CalendarDays, FileText, Layout, FormInput, FolderOpen, GitPullRequest,
  Package, BarChart3, Bell, ActivitySquare, Shield, Settings, Database,
  ClipboardList, Award, BookOpen, ChevronLeft, ChevronRight, LogOut, X,
} from 'lucide-react';
import { useSelector as useAppSelector } from 'react-redux';
import axios from 'axios';
import { clearCredentials } from '@/lib/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  roles?: string[];
  children?: { label: string; href: string }[];
}

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Departments', href: '/departments', icon: Building2, roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN'] },
      { label: 'Users', href: '/users', icon: Users, roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN'] },
      { label: 'Faculty', href: '/faculty', icon: UserSquare2 },
      { label: 'Students', href: '/students', icon: GraduationCap },
    ],
  },
  {
    title: 'Academics',
    items: [
      { label: 'Events', href: '/events', icon: CalendarDays },
      { label: 'Circulars', href: '/circulars', icon: ClipboardList },
      { label: 'Achievements', href: '/achievements', icon: Award },
      { label: 'MOM', href: '/mom', icon: BookOpen },
    ],
  },
  {
    title: 'Documents',
    items: [
      { label: 'Documents', href: '/documents', icon: FileText },
      { label: 'Templates', href: '/templates', icon: Layout },
      { label: 'Form Builder', href: '/forms', icon: FormInput },
      { label: 'File Manager', href: '/file-manager', icon: FolderOpen },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Approvals', href: '/approvals', icon: GitPullRequest, badge: 0 },
      { label: 'Inventory', href: '/inventory', icon: Package },
      { label: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Activity Logs', href: '/activity-logs', icon: ActivitySquare, roles: ['SUPER_ADMIN'] },
      { label: 'Audit Logs', href: '/audit-logs', icon: Shield, roles: ['SUPER_ADMIN'] },
      { label: 'Backup', href: '/settings?tab=backup', icon: Database, roles: ['SUPER_ADMIN'] },
      { label: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN'] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();
  const { sidebarCollapsed, sidebarMobileOpen } = useSelector((s: RootState) => s.ui);
  const user = useSelector((s: RootState) => s.auth.user);
  const { unreadCount } = useSelector((s: RootState) => s.notifications);

  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        withCredentials: true,
      });
    } catch (_) {}
    localStorage.removeItem('accessToken');
    dispatch(clearCredentials());
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Logo ─────────────────────────────────── */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-5 border-b border-slate-200 dark:border-slate-700',
        sidebarCollapsed ? 'justify-center' : ''
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight font-display">CDDAS</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                {user?.college?.shortName || 'College Portal'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav ──────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.roles || !user || item.roles.includes(user.role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title}>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 px-3 mb-2"
                  >
                    {group.title}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  const badge = item.label === 'Notifications' ? unreadCount
                    : item.label === 'Approvals' ? (item.badge ?? 0)
                    : 0;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => dispatch(setSidebarMobileOpen(false))}
                      className={clsx(
                        'sidebar-link relative',
                        active && 'active',
                        sidebarCollapsed && 'justify-center px-0 py-2.5'
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <item.icon className={clsx('w-5 h-5 shrink-0', active ? 'text-white' : '')} />
                      <AnimatePresence>
                        {!sidebarCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="overflow-hidden whitespace-nowrap flex-1"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {badge > 0 && (
                        <span className={clsx(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-primary-600 text-white',
                          sidebarCollapsed && 'absolute -top-1 -right-1'
                        )}>
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── User Footer ──────────────────────────── */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-3">
        <div className={clsx(
          'flex items-center gap-3',
          sidebarCollapsed && 'justify-center'
        )}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 overflow-hidden min-w-0"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.role?.replace(/_/g, ' ')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              id="sidebar-logout-btn"
              className="btn-icon text-slate-400 hover:text-red-500"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 h-screen sticky top-0 overflow-hidden shrink-0"
        style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.04)' }}
      >
        {/* Collapse toggle */}
        <button
          id="sidebar-collapse-btn"
          onClick={() => dispatch(toggleSidebar())}
          className="absolute -right-3 top-16 z-10 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 hover:text-primary-600 shadow-sm transition-all"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
        {sidebarContent}
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed left-0 top-0 bottom-0 w-[260px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-50 lg:hidden flex flex-col"
          >
            <button
              className="absolute top-4 right-4 btn-icon"
              onClick={() => dispatch(setSidebarMobileOpen(false))}
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
