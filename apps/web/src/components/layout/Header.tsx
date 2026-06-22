'use client';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { setSidebarMobileOpen, toggleDarkMode } from '@/lib/store/slices/uiSlice';
import { Menu, Sun, Moon, Bell, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export function Header() {
  const dispatch = useDispatch();
  const { darkMode, breadcrumbs, currentPageTitle } = useSelector((s: RootState) => s.ui);
  const { unreadCount } = useSelector((s: RootState) => s.notifications);
  const user = useSelector((s: RootState) => s.auth.user);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
      {/* Mobile menu button */}
      <button
        id="header-menu-btn"
        className="lg:hidden btn-icon"
        onClick={() => dispatch(setSidebarMobileOpen(true))}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm hidden sm:flex">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          Home
        </Link>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            {crumb.href ? (
              <Link href={crumb.href} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-slate-900 dark:text-white font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          id="global-search"
          type="text"
          placeholder="Search anything..."
          className="input pl-9 pr-4 py-2 w-56 lg:w-72 text-sm"
        />
      </div>

      {/* Dark mode */}
      <motion.button
        id="toggle-dark-mode"
        onClick={() => dispatch(toggleDarkMode())}
        className="btn-icon"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Toggle dark mode"
      >
        {darkMode ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-slate-500" />
        )}
      </motion.button>

      {/* Notifications */}
      <Link href="/notifications" id="header-notifications">
        <motion.div
          className="btn-icon relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="notification-dot"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.div>
      </Link>

      {/* User avatar */}
      <Link href="/settings" id="header-user-avatar">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold cursor-pointer shadow-md"
          title={`${user?.firstName} ${user?.lastName}`}
        >
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </motion.div>
      </Link>
    </header>
  );
}
