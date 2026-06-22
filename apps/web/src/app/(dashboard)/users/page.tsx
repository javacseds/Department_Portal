'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Users, Shield, Mail, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { USER_ROLES } from '@cddas/shared';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', searchTerm, roleFilter],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users`, {
        params: { search: searchTerm, role: roleFilter },
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete user ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-500" />
            User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage system users, roles, and access permissions
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select 
            className="input w-full sm:w-40"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {Object.values(USER_ROLES).map(role => (
              <option key={role} value={role}>{role.replace('_', ' ')}</option>
            ))}
          </select>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              className="input pl-9 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={openCreateModal} className="btn-primary w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role & Dept</th>
                <th>Employee ID</th>
                <th>Status</th>
                <th>Last Login</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(null).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4">
                      <div className="skeleton h-12 w-full" />
                    </td>
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <Shield className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="font-medium">No users found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or add a new user.</p>
                  </td>
                </tr>
              ) : (
                data?.data?.map((user: any) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <span className="badge badge-primary text-xs">
                          {user.role.replace('_', ' ')}
                        </span>
                        {user.department && (
                          <p className="text-xs text-slate-500 font-medium">
                            {user.department.name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                        {user.employeeId || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="btn-icon text-slate-400 hover:text-primary-600"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
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

      <AnimatePresence>
        {isModalOpen && (
          <UserModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            user={editingUser}
            onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['users'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Modal Component ──────────────────────────────────────────────

function UserModal({ isOpen, onClose, user, onSuccess }: any) {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    password: '',
    role: user?.role || USER_ROLES.FACULTY,
    employeeId: user?.employeeId || '',
    designation: user?.designation || '',
    departmentId: user?.department?.id || '',
    isActive: user?.isActive !== false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch departments for dropdown
  const { data: deptsData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/departments?limit=100`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = user 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${user.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users`;
      
      const method = user ? 'put' : 'post';
      
      // Clean empty strings for optional fields
      const payload: any = { ...formData };
      if (!payload.password) delete payload.password;
      if (!payload.departmentId) delete payload.departmentId;
      if (!payload.employeeId) delete payload.employeeId;
      
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      
      toast.success(`User ${user ? 'updated' : 'created'} successfully`);
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
        className="card w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-xl font-bold font-display">
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose} className="btn-icon text-slate-400">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Personal Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">Personal Details</h3>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Email Address</label>
                <input required type="email" className="input" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="label">
                  {user ? 'New Password (leave empty to keep)' : 'Password'}
                </label>
                <input 
                  type="password" 
                  required={!user} 
                  className="input" 
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
                />
              </div>
            </div>
          </div>

          {/* Organizational Details */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">Organizational Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">System Role</label>
                <select required className="input" 
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  {Object.values(USER_ROLES).map(role => (
                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Department</label>
                <select className="input" 
                  value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                  <option value="">None (College Level)</option>
                  {deptsData?.data?.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Employee ID (Optional)</label>
                <input type="text" className="input" placeholder="e.g. EMP-001"
                  value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} />
              </div>
              <div>
                <label className="label">Designation (Optional)</label>
                <input type="text" className="input" placeholder="e.g. Assistant Professor"
                  value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
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
                <span className="text-sm font-medium">Account Active</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
