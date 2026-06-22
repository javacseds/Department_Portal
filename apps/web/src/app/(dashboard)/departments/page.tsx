'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Building2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function DepartmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['departments', searchTerm],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/departments`, {
        params: { search: searchTerm },
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/departments/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete department');
    }
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (dept: any) => {
    setEditingDept(dept);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingDept(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary-500" />
            Departments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage college departments, HODs, and settings
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search departments..."
              className="input pl-9 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={openCreateModal} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Department</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Department Name</th>
                <th>HOD</th>
                <th>Stats</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(null).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4">
                      <div className="skeleton h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <Building2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="font-medium">No departments found</p>
                    <p className="text-sm mt-1">Try adjusting your search or add a new department.</p>
                  </td>
                </tr>
              ) : (
                data?.data?.map((dept: any) => (
                  <tr key={dept.id}>
                    <td>
                      <span className="badge badge-neutral font-mono">{dept.code}</span>
                    </td>
                    <td>
                      <p className="font-semibold text-slate-900 dark:text-white">{dept.name}</p>
                      <p className="text-xs text-slate-500">{dept.shortName} • Est. {dept.established}</p>
                    </td>
                    <td>
                      {dept.hod ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                            {dept.hod.firstName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{dept.hod.firstName} {dept.hod.lastName}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not Assigned</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1" title="Faculty">
                          <Users className="w-3.5 h-3.5" /> {dept._count.faculty}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${dept.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(dept)}
                          className="btn-icon text-slate-400 hover:text-primary-600"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(dept.id, dept.name)}
                          className="btn-icon text-slate-400 hover:text-red-500"
                          title="Delete"
                        >
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

      {/* We will implement the modal in a separate component or inline if needed */}
      <AnimatePresence>
        {isModalOpen && (
          <DepartmentModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            department={editingDept}
            onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['departments'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Modal Component ──────────────────────────────────────────────

function DepartmentModal({ isOpen, onClose, department, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    shortName: department?.shortName || '',
    code: department?.code || '',
    established: department?.established || new Date().getFullYear(),
    isActive: department?.isActive !== false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = department 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/departments/${department.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/departments`;
      
      const method = department ? 'put' : 'post';
      
      // We will need collegeId from the auth context in a real app,
      // but our API will infer it from the logged in user automatically!
      
      await axios[method](url, {
        ...formData,
        established: Number(formData.established)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      
      toast.success(`Department ${department ? 'updated' : 'created'} successfully`);
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
        className="card w-full max-w-lg shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold font-display">
            {department ? 'Edit Department' : 'Add New Department'}
          </h2>
          <button onClick={onClose} className="btn-icon text-slate-400">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Department Name</label>
            <input 
              required
              type="text" 
              className="input" 
              placeholder="e.g. Computer Science and Engineering"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Short Name</label>
              <input 
                required
                type="text" 
                className="input" 
                placeholder="e.g. CSE"
                value={formData.shortName}
                onChange={e => setFormData({...formData, shortName: e.target.value})}
              />
            </div>
            <div>
              <label className="label">Code</label>
              <input 
                required
                type="text" 
                className="input" 
                placeholder="e.g. CS01"
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Established Year</label>
              <input 
                type="number" 
                className="input" 
                min="1900" 
                max="2100"
                value={formData.established}
                onChange={e => setFormData({...formData, established: parseInt(e.target.value)})}
              />
            </div>
            <div className="flex items-center pt-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                />
                <span className="text-sm font-medium">Active Status</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : 'Save Department'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
