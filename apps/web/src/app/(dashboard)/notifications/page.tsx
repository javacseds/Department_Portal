'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Bell, Check, CheckCircle2, Clock, Trash2, ShieldAlert, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications?limit=100`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    }
  });

  const getIcon = (type: string) => {
    switch(type) {
      case 'APPROVAL': return <CheckCircle2 className="w-5 h-5 text-amber-500" />;
      case 'EVENT': return <CalendarIcon className="w-5 h-5 text-blue-500" />;
      case 'REMINDER': return <Clock className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary-500" />
            Notification Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with recent system alerts, approvals, and messages
          </p>
        </div>
        
        {data?.unreadCount > 0 && (
          <button 
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="btn-secondary text-sm"
          >
            <Check className="w-4 h-4 mr-2" /> Mark all as read
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array(5).fill(null).map((_, i) => (
              <div key={i} className="p-4 flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Bell className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-medium text-lg">All caught up!</p>
            <p className="text-sm mt-1">You have no new notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data?.data?.map((notification: any) => (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={notification.id}
                className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-start gap-4 ${!notification.isRead ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm truncate pr-4 ${!notification.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                      {notification.link ? (
                        <Link href={notification.link} className="hover:text-primary-600 transition-colors">
                          {notification.title}
                        </Link>
                      ) : (
                        notification.title
                      )}
                    </h3>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0 whitespace-nowrap">
                      {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-sm line-clamp-2 ${!notification.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    {notification.message}
                  </p>
                  
                  {notification.link && (
                    <Link href={notification.link} className="inline-block mt-2 text-xs font-semibold text-primary-600 hover:text-primary-700">
                      View details →
                    </Link>
                  )}
                </div>

                {!notification.isRead && (
                  <button 
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                    className="shrink-0 w-2.5 h-2.5 rounded-full bg-primary-500 mt-2"
                    title="Mark as read"
                  />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
