'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Award, BookOpen, Lightbulb, ExternalLink, Calendar, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AchievementsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<any>(null);
  
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

  const { data: facultyData } = useQuery({
    queryKey: ['faculty-list'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/faculty?limit=500`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const { data: studentData } = useQuery({
    queryKey: ['student-list'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/students?limit=500`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['achievements', searchTerm, typeFilter],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/achievements`, {
        params: { search: searchTerm, type: typeFilter },
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/achievements/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      toast.success('Achievement deleted successfully');
    }
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (achievement: any) => {
    setEditingAchievement(achievement);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingAchievement(null);
    setIsModalOpen(true);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'PUBLICATION': return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'PATENT': return <Lightbulb className="w-5 h-5 text-amber-500" />;
      case 'AWARD': return <Award className="w-5 h-5 text-rose-500" />;
      case 'PROJECT': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default: return <Award className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Award className="w-6 h-6 text-primary-500" />
            Achievements & Publications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track faculty and student research, patents, awards, and projects.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select 
            className="input w-full sm:w-40"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="PUBLICATION">Publications</option>
            <option value="PATENT">Patents</option>
            <option value="AWARD">Awards</option>
            <option value="PROJECT">Projects</option>
          </select>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search achievements..."
              className="input pl-9 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={openCreateModal} className="btn-primary w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4" />
            <span>Log Achievement</span>
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type & Title</th>
                <th>Author / Recipient</th>
                <th>Department</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(null).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4"><div className="skeleton h-12 w-full" /></td>
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <Award className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="font-medium">No achievements found</p>
                  </td>
                </tr>
              ) : (
                data?.data?.map((item: any) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-start gap-3 max-w-sm">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                          {getIconForType(item.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-2" title={item.title}>
                            {item.title}
                          </p>
                          <span className="text-[10px] font-mono text-slate-500">{item.type}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {item.faculty ? (
                        <p className="text-sm font-medium">Dr. {item.faculty.user.firstName} {item.faculty.user.lastName} <span className="text-xs text-slate-400 font-normal">(Faculty)</span></p>
                      ) : item.student ? (
                        <p className="text-sm font-medium">{item.student.firstName} {item.student.lastName} <span className="text-xs text-slate-400 font-normal">({item.student.rollNumber})</span></p>
                      ) : (
                        <p className="text-sm text-slate-500 italic">Institutional</p>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-neutral">{item.department?.shortName || 'N/A'}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        item.status === 'VERIFIED' ? 'badge-success' : 
                        item.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {item.proofUrl && (
                          <a href={item.proofUrl} target="_blank" rel="noopener noreferrer" className="btn-icon text-slate-400 hover:text-blue-500" title="View Proof">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => openEditModal(item)} className="btn-icon text-slate-400 hover:text-primary-600">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id, item.title)} className="btn-icon text-slate-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <AchievementModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            achievement={editingAchievement}
            departments={deptsData?.data || []}
            facultyList={facultyData?.data || []}
            studentList={studentData?.data || []}
            onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['achievements'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Modal Component ──────────────────────────────────────────────

const ACHIEVEMENT_TYPES = ['PUBLICATION', 'PATENT', 'AWARD', 'PROJECT'];

function AchievementModal({ isOpen, onClose, achievement, departments, facultyList, studentList, onSuccess }: any) {
  const [formData, setFormData] = useState({
    type: achievement?.type || 'PUBLICATION',
    title: achievement?.title || '',
    description: achievement?.description || '',
    date: achievement?.date ? new Date(achievement.date).toISOString().split('T')[0] : '',
    departmentId: achievement?.departmentId || '',
    facultyId: achievement?.facultyId || '',
    studentId: achievement?.studentId || '',
    proofUrl: achievement?.proofUrl || '',
    status: achievement?.status || 'PENDING',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = achievement 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/achievements/${achievement.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/achievements`;
      
      const method = achievement ? 'put' : 'post';
      
      const payload: any = { ...formData };
      if (!payload.facultyId) delete payload.facultyId;
      if (!payload.studentId) delete payload.studentId;
      if (!payload.departmentId) delete payload.departmentId;
      
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      
      toast.success(`Achievement ${achievement ? 'updated' : 'logged'} successfully`);
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
            {achievement ? 'Edit Achievement' : 'Log New Achievement'}
          </h2>
          <button type="button" onClick={onClose} className="btn-icon text-slate-400">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Achievement Type</label>
              <select required className="input font-medium text-primary-700 dark:text-primary-400" 
                value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                {ACHIEVEMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date (Published / Awarded)</label>
              <input required type="date" className="input" 
                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="label">Title</label>
            <input required type="text" className="input" placeholder="e.g. Research Paper on Quantum Computing"
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div>
            <label className="label">Description / Abstract</label>
            <textarea className="input resize-none" rows={3} placeholder="Brief summary..."
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attribution</h3>
            
            <div>
              <label className="label">Department</label>
              <select className="input text-sm" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                <option value="">Select Department</option>
                {departments.map((dept: any) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Faculty Member</label>
                <select className="input text-sm" value={formData.facultyId} onChange={e => {
                  setFormData({...formData, facultyId: e.target.value, studentId: ''});
                }}>
                  <option value="">None / Not Applicable</option>
                  {facultyList.map((fac: any) => (
                    <option key={fac.id} value={fac.id}>Dr. {fac.user.firstName} {fac.user.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Student</label>
                <select className="input text-sm" value={formData.studentId} onChange={e => {
                  setFormData({...formData, studentId: e.target.value, facultyId: ''});
                }} disabled={!!formData.facultyId}>
                  <option value="">None / Not Applicable</option>
                  {studentList.map((stu: any) => (
                    <option key={stu.id} value={stu.id}>{stu.firstName} {stu.lastName} ({stu.rollNumber})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Proof URL / DOI Link</label>
              <input type="url" className="input" placeholder="https://..."
                value={formData.proofUrl} onChange={e => setFormData({...formData, proofUrl: e.target.value})} />
            </div>
            <div>
              <label className="label">Verification Status</label>
              <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="PENDING">Pending Verification</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : 'Save Achievement'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
