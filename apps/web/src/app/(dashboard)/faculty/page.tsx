'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, GraduationCap, Mail, Phone, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function FacultyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any>(null);
  
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
    queryKey: ['faculty', searchTerm, deptFilter],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/faculty`, {
        params: { search: searchTerm, departmentId: deptFilter },
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/faculty/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      toast.success('Faculty member deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete faculty');
    }
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (faculty: any) => {
    setEditingFaculty(faculty);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingFaculty(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary-500" />
            Faculty Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage faculty records, designations, and departmental assignments
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select 
            className="input w-full sm:w-48"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {deptsData?.data?.map((dept: any) => (
              <option key={dept.id} value={dept.id}>{dept.shortName} - {dept.name}</option>
            ))}
          </select>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search faculty..."
              className="input pl-9 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={openCreateModal} className="btn-primary w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4" />
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(null).map((_, i) => (
            <div key={i} className="card p-6 flex flex-col gap-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2 mt-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
              </div>
            </div>
          ))
        ) : data?.data?.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-slate-500">
            <GraduationCap className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-medium">No faculty members found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a new faculty member.</p>
          </div>
        ) : (
          data?.data?.map((faculty: any) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={faculty.id} 
              className="card p-5 flex flex-col hover:border-primary-200 transition-colors group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex flex-col items-center justify-center font-bold text-lg shadow-inner">
                    {faculty.user.avatarUrl ? (
                      <img src={faculty.user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <>{faculty.user.firstName[0]}{faculty.user.lastName[0]}</>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1" title={`${faculty.user.firstName} ${faculty.user.lastName}`}>
                      {faculty.user.firstName} {faculty.user.lastName}
                    </h3>
                    <p className="text-xs text-primary-600 font-medium">
                      {faculty.designation}
                    </p>
                    <span className="badge badge-neutral text-[10px] mt-1">
                      {faculty.department.shortName}
                    </span>
                  </div>
                </div>
                
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(faculty)}
                    className="btn-icon text-slate-400 hover:text-primary-600 w-8 h-8"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(faculty.id, `${faculty.user.firstName} ${faculty.user.lastName}`)}
                    className="btn-icon text-slate-400 hover:text-red-500 w-8 h-8"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate" title={faculty.user.email}>{faculty.user.email}</span>
                </div>
                {faculty.user.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{faculty.user.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mt-2">
                  <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono">
                    ID: {faculty.employeeId}
                  </span>
                  <span className={`text-xs flex items-center gap-1.5 ${faculty.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${faculty.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {faculty.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <FacultyModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            faculty={editingFaculty}
            departments={deptsData?.data || []}
            onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['faculty'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Modal Component ──────────────────────────────────────────────

function FacultyModal({ isOpen, onClose, faculty, departments, onSuccess }: any) {
  const [formData, setFormData] = useState({
    firstName: faculty?.user?.firstName || '',
    lastName: faculty?.user?.lastName || '',
    email: faculty?.user?.email || '',
    phone: faculty?.user?.phone || '',
    departmentId: faculty?.departmentId || '',
    employeeId: faculty?.employeeId || '',
    designation: faculty?.designation || '',
    qualification: faculty?.qualification || '',
    specialization: faculty?.specialization || '',
    experience: faculty?.experience || '',
    dateOfJoining: faculty?.dateOfJoining ? new Date(faculty.dateOfJoining).toISOString().split('T')[0] : '',
    isActive: faculty?.isActive !== false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = faculty 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/faculty/${faculty.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/faculty`;
      
      const method = faculty ? 'put' : 'post';
      
      const payload: any = { ...formData };
      if (!payload.experience) delete payload.experience;
      if (!payload.dateOfJoining) delete payload.dateOfJoining;
      
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      
      toast.success(`Faculty ${faculty ? 'updated' : 'created'} successfully`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="card w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-xl font-bold font-display">
            {faculty ? 'Edit Faculty' : 'Add New Faculty'}
          </h2>
          <button onClick={onClose} className="btn-icon text-slate-400">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column: Personal Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b pb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-500" />
                Personal Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input required type="text" className="input" 
                    value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input required type="text" className="input" 
                    value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="label">Email Address</label>
                <input required type="email" className="input" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div>
                <label className="label">Phone Number</label>
                <input type="tel" className="input" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>

            {/* Right Column: Professional Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b pb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-500" />
                Professional Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Department</label>
                  <select required className="input" 
                    value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                    <option value="" disabled>Select Department</option>
                    {departments.map((dept: any) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Employee ID</label>
                  <input required type="text" className="input" placeholder="e.g. FAC-001"
                    value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="label">Designation</label>
                <input required type="text" className="input" placeholder="e.g. Assistant Professor"
                  value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Qualification</label>
                  <input type="text" className="input" placeholder="e.g. Ph.D"
                    value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} />
                </div>
                <div>
                  <label className="label">Experience (Years)</label>
                  <input type="number" className="input" min="0" step="0.5"
                    value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={formData.isActive}
                onChange={e => setFormData({...formData, isActive: e.target.checked})}
              />
              <span className="text-sm font-medium">Currently Active</span>
            </label>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : 'Save Faculty'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
