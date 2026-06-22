'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Search, Activity, ShieldAlert, User, Database, Globe, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', searchTerm, actionFilter],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/audit-logs`, {
        params: { search: searchTerm, action: actionFilter },
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const getActionColor = (action: string) => {
    switch(action.toUpperCase()) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'LOGIN': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'EXPORT': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary-500" />
            System Audit & Activity Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track user actions, data modifications, and security events. Restricted to Super Admins.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select 
            className="input w-full sm:w-40"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="EXPORT">Export</option>
          </select>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search user, IP..."
              className="input pl-9 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-secondary w-full sm:w-auto shrink-0">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Action & Entity</th>
                <th>User Details</th>
                <th>IP & Client</th>
                <th>Date & Time</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(10).fill(null).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="p-4"><div className="skeleton h-12 w-full" /></td>
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    <Activity className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="font-medium">No logs found</p>
                  </td>
                </tr>
              ) : (
                data?.data?.map((log: any) => (
                  <tr key={log.id} className="text-sm">
                    <td>
                      <div className="flex flex-col items-start gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                          <Database className="w-3.5 h-3.5 text-slate-400" />
                          {log.entity}
                        </div>
                      </div>
                    </td>
                    <td>
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium">{log.user.firstName} {log.user.lastName}</p>
                            <p className="text-[10px] text-slate-500">{log.user.role.replace('_', ' ')}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">System / Anonymous</span>
                      )}
                    </td>
                    <td>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="font-mono text-xs">{log.ipAddress || 'Unknown IP'}</span>
                        </div>
                        {log.userAgent && (
                          <p className="text-[10px] text-slate-500 line-clamp-1 max-w-[200px]" title={log.userAgent}>
                            {log.userAgent}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-slate-600 dark:text-slate-400">
                        <p className="font-medium">{new Date(log.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs">{new Date(log.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </td>
                    <td>
                      {log.details ? (
                        <button 
                          className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                          onClick={() => alert(JSON.stringify(log.details, null, 2))}
                        >
                          View JSON
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
