'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { FileSpreadsheet, Download, Filter, BookOpen, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [departmentId, setDepartmentId] = useState('');
  const [year, setYear] = useState('');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const { data: deptsData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/departments?limit=100`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const handleExport = async (type: 'achievements' | 'events') => {
    setIsExporting(type);
    
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/export/${type}`);
      if (departmentId) url.searchParams.append('departmentId', departmentId);
      if (year) url.searchParams.append('year', year);

      // Using fetch instead of axios for easier blob handling with authorization
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      // Trigger download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${type}_report_${year || 'all'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download report');
      console.error(error);
    } finally {
      setIsExporting(null);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-primary-500" />
            Compliance & Reports Export
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate NAAC/NBA formatted Excel reports for institutional data
          </p>
        </div>
      </div>

      <div className="card p-6 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-500" /> Global Filters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="label">Department</label>
            <select 
              className="input" 
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">All Departments (Institutional)</option>
              {deptsData?.data?.map((dept: any) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Academic Year</label>
            <select 
              className="input" 
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">All Years</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Achievements Export Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 border-t-4 border-t-primary-500 flex flex-col h-full"
        >
          <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2">Faculty Achievements Report</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1">
            Exports a detailed list of research publications, patents, and awards achieved by faculty members. 
            Formatted specifically for NAAC Criterion 3 (Research, Innovations and Extension).
          </p>
          
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Includes Employee IDs
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Includes Verification Status
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Includes Digital Proof Links
            </div>
          </div>

          <button 
            onClick={() => handleExport('achievements')}
            disabled={isExporting !== null}
            className="btn-primary w-full justify-center"
          >
            {isExporting === 'achievements' ? 'Generating Excel...' : (
              <><Download className="w-4 h-4 mr-2" /> Download Excel Format</>
            )}
          </button>
        </motion.div>

        {/* Events Export Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 border-t-4 border-t-blue-500 flex flex-col h-full"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-4">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-2">Events & Programs Report</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1">
            Exports all seminars, conferences, workshops, and training programs organized by the institution or departments.
            Includes budgeting and attendance details.
          </p>
          
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Categorized by Program Type
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Includes Budget Information
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Includes Organizers List
            </div>
          </div>

          <button 
            onClick={() => handleExport('events')}
            disabled={isExporting !== null}
            className="w-full justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center shadow-sm"
          >
            {isExporting === 'events' ? 'Generating Excel...' : (
              <><Download className="w-4 h-4 mr-2" /> Download Excel Format</>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
