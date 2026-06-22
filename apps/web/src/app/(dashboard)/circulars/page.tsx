'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Bell, AlertCircle, FileText, Megaphone, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { USER_ROLES } from '@cddas/shared';

export default function CircularsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCircular, setEditingCircular] = useState<any>(null);
  
  const queryClient = useQueryClient();

  const { data: deptsData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/departments?limit=100`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['circulars', searchTerm, typeFilter],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/circulars`, {
        params: { search: searchTerm, type: typeFilter },
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/circulars/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circulars'] });
      toast.success('Circular deleted successfully');
    }
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (circular: any) => {
    setEditingCircular(circular);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingCircular(null);
    setIsModalOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'URGENT': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'ACADEMIC': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'EXAM': return <FileText className="w-5 h-5 text-purple-500" />;
      case 'HOLIDAY': return <Calendar className="w-5 h-5 text-emerald-500" />;
      default: return <Megaphone className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary-500" />
            Circulars & Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Publish and manage official communications across the institution
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select 
            className="input w-full sm:w-40"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="GENERAL">General</option>
            <option value="ACADEMIC">Academic</option>
            <option value="EXAM">Examination</option>
            <option value="HOLIDAY">Holiday</option>
            <option value="URGENT">Urgent</option>
          </select>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ref no, title..."
              className="input pl-9 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={openCreateModal} className="btn-primary w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4" />
            <span>New Circular</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array(4).fill(null).map((_, i) => (
            <div key={i} className="card p-6 h-32 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))
        ) : data?.data?.length === 0 ? (
          <div className="card p-12 text-center text-slate-500 border-dashed">
            <Megaphone className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-medium">No circulars found</p>
            <p className="text-sm mt-1">Publish a circular to notify users.</p>
          </div>
        ) : (
          data?.data?.map((circular: any) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={circular.id} 
              className={`card group flex flex-col md:flex-row items-start gap-4 p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-colors ${circular.type === 'URGENT' ? 'border-l-4 border-l-red-500' : ''}`}
            >
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                {getTypeIcon(circular.type)}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-semibold text-slate-500">{circular.referenceNo}</span>
                      {circular.isGlobal ? (
                        <span className="badge badge-primary text-[10px]">GLOBAL</span>
                      ) : (
                        <span className="badge badge-neutral text-[10px]">{circular.department?.shortName}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{circular.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(circular)} className="btn-icon text-slate-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(circular.id, circular.title)} className="btn-icon text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {circular.content}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Issued: {new Date(circular.issueDate).toLocaleDateString()}</span>
                  </div>
                  {circular.validUntil && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Valid Till: {new Date(circular.validUntil).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex gap-1.5 ml-auto">
                    {circular.targetAudience.map((audience: string) => (
                      <span key={audience} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium text-[10px]">
                        {audience.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CircularModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            circular={editingCircular}
            departments={deptsData?.data || []}
            onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['circulars'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Modal Component ──────────────────────────────────────────────

const CIRCULAR_TYPES = ['GENERAL', 'ACADEMIC', 'EXAM', 'HOLIDAY', 'URGENT'];

function CircularModal({ isOpen, onClose, circular, departments, onSuccess }: any) {
  const [formData, setFormData] = useState({
    referenceNo: circular?.referenceNo || `CIR-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
    title: circular?.title || '',
    content: circular?.content || '',
    type: circular?.type || 'GENERAL',
    departmentId: circular?.departmentId || '',
    isGlobal: circular?.isGlobal !== false,
    issueDate: circular?.issueDate ? new Date(circular.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    validUntil: circular?.validUntil ? new Date(circular.validUntil).toISOString().split('T')[0] : '',
    targetAudience: circular?.targetAudience || [USER_ROLES.FACULTY, USER_ROLES.STUDENT],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleAudience = (role: string) => {
    const arr = formData.targetAudience;
    if (arr.includes(role)) {
      setFormData({ ...formData, targetAudience: arr.filter((r: string) => r !== role) });
    } else {
      setFormData({ ...formData, targetAudience: [...arr, role] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.targetAudience.length === 0) {
      toast.error('Please select at least one target audience');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const url = circular 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/circulars/${circular.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/circulars`;
      
      const method = circular ? 'put' : 'post';
      
      const payload: any = { ...formData };
      if (payload.isGlobal) payload.departmentId = undefined;
      if (!payload.validUntil) delete payload.validUntil;
      
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      
      toast.success(`Circular ${circular ? 'updated' : 'published'} successfully`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="card w-full max-w-2xl shadow-2xl my-8 flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 sticky top-0 rounded-t-xl z-10">
          <h2 className="text-xl font-bold font-display">
            {circular ? 'Edit Circular' : 'Publish Circular'}
          </h2>
          <button type="button" onClick={onClose} className="btn-icon text-slate-400">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Reference No.</label>
              <input required type="text" className="input font-mono" 
                value={formData.referenceNo} onChange={e => setFormData({...formData, referenceNo: e.target.value})} />
            </div>
            <div>
              <label className="label">Circular Type</label>
              <select required className="input" 
                value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                {CIRCULAR_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Title / Subject</label>
            <input required type="text" className="input" placeholder="e.g. Declaration of Holiday for Sankranti"
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div>
            <label className="label">Detailed Content</label>
            <textarea required className="input resize-none" rows={6} placeholder="Write the circular content here..."
              value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Issue Date</label>
              <input required type="date" className="input" 
                value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} />
            </div>
            <div>
              <label className="label">Valid Until (Optional)</label>
              <input type="date" className="input" 
                value={formData.validUntil} onChange={e => setFormData({...formData, validUntil: e.target.value})} />
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Distribution Settings</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded text-primary-600"
                  checked={formData.isGlobal} onChange={e => setFormData({...formData, isGlobal: e.target.checked})} />
                <span className="text-sm font-medium">Global (All Departments)</span>
              </label>
            </div>
            
            {!formData.isGlobal && (
              <div>
                <label className="label">Specific Department</label>
                <select className="input text-sm" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} required={!formData.isGlobal}>
                  <option value="">Select Department</option>
                  {departments.map((dept: any) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="label">Target Audience (Select at least one)</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[USER_ROLES.FACULTY, USER_ROLES.STUDENT, USER_ROLES.HOD, USER_ROLES.OFFICE_STAFF].map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleAudience(role)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      formData.targetAudience.includes(role)
                        ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:border-primary-800 dark:text-primary-300'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {role.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Publishing...' : 'Publish Circular'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
