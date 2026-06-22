'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Users, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  
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
    queryKey: ['students', searchTerm, deptFilter, batchFilter],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/students`, {
        params: { search: searchTerm, departmentId: deptFilter, batch: batchFilter },
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    }
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-500" />
            Student Records
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage student details, batches, and departmental assignments
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
          <button className="btn-secondary w-full sm:w-auto shrink-0 hidden sm:flex">
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button className="btn-secondary w-full sm:w-auto shrink-0 hidden sm:flex">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button onClick={openCreateModal} className="btn-primary w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, roll no..."
            className="input pl-9 text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="input w-full sm:w-48 text-sm"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {deptsData?.data?.map((dept: any) => (
            <option key={dept.id} value={dept.id}>{dept.shortName}</option>
          ))}
        </select>

        <select 
          className="input w-full sm:w-40 text-sm"
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
        >
          <option value="">All Batches</option>
          <option value="2020-2024">2020-2024</option>
          <option value="2021-2025">2021-2025</option>
          <option value="2022-2026">2022-2026</option>
          <option value="2023-2027">2023-2027</option>
          <option value="2024-2028">2024-2028</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Student Details</th>
                <th>Department</th>
                <th>Batch/Sec</th>
                <th>Status</th>
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
                    <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="font-medium">No students found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or add a new student.</p>
                  </td>
                </tr>
              ) : (
                data?.data?.map((student: any) => (
                  <tr key={student.id}>
                    <td>
                      <span className="font-mono font-medium text-slate-900 dark:text-white">
                        {student.rollNumber}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-medium text-xs">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {student.firstName} {student.lastName}
                          </p>
                          {student.email && (
                            <p className="text-xs text-slate-500">{student.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {student.department.shortName}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm">
                        <p className="font-medium">{student.batch}</p>
                        {student.section && <p className="text-xs text-slate-500">Sec: {student.section}</p>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${student.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(student)}
                          className="btn-icon text-slate-400 hover:text-primary-600"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)}
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
          <StudentModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            student={editingStudent}
            departments={deptsData?.data || []}
            onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['students'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Modal Component ──────────────────────────────────────────────

function StudentModal({ isOpen, onClose, student, departments, onSuccess }: any) {
  const [formData, setFormData] = useState({
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    email: student?.email || '',
    phone: student?.phone || '',
    departmentId: student?.departmentId || '',
    rollNumber: student?.rollNumber || '',
    registerNumber: student?.registerNumber || '',
    batch: student?.batch || '',
    section: student?.section || '',
    semester: student?.semester || '',
    dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
    gender: student?.gender || '',
    isActive: student?.isActive !== false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = student 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/${student.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students`;
      
      const method = student ? 'put' : 'post';
      
      const payload: any = { ...formData };
      if (!payload.semester) delete payload.semester;
      else payload.semester = Number(payload.semester);
      if (!payload.dateOfBirth) delete payload.dateOfBirth;
      if (!payload.email) delete payload.email;
      if (!payload.registerNumber) delete payload.registerNumber;
      
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      
      toast.success(`Student ${student ? 'updated' : 'created'} successfully`);
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
            {student ? 'Edit Student' : 'Add New Student'}
          </h2>
          <button onClick={onClose} className="btn-icon text-slate-400">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          
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
              <label className="label">Roll Number</label>
              <input required type="text" className="input" placeholder="e.g. 21X01A0501"
                value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} />
            </div>
            <div>
              <label className="label">Register Number (Optional)</label>
              <input type="text" className="input"
                value={formData.registerNumber} onChange={e => setFormData({...formData, registerNumber: e.target.value})} />
            </div>
          </div>
          
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
              <label className="label">Batch</label>
              <input required type="text" className="input" placeholder="e.g. 2021-2025"
                value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Section (Optional)</label>
              <input type="text" className="input" placeholder="e.g. A"
                value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} />
            </div>
            <div>
              <label className="label">Semester (Optional)</label>
              <input type="number" className="input" min="1" max="8"
                value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email Address (Optional)</label>
              <input type="email" className="input" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="label">Phone Number (Optional)</label>
              <input type="tel" className="input" 
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
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
              <span className="text-sm font-medium">Active Student</span>
            </label>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : 'Save Student'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
