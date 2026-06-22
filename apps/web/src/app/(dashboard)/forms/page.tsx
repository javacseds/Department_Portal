'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Plus, Search, Edit2, Trash2, FileSignature, Copy, Share2, Eye,
  LayoutTemplate, CheckSquare, AlignLeft, Calendar, Image as ImageIcon, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function FormsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['forms', searchTerm],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/forms`, {
        params: { search: searchTerm },
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/forms/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form deleted successfully');
    }
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the form "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (form: any) => {
    setEditingForm(form);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingForm(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-primary-500" />
            Dynamic Form Builder
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, manage, and share custom data collection forms
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search forms..."
              className="input pl-9 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={openCreateModal} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" />
            <span>Create Form</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array(3).fill(null).map((_, i) => (
            <div key={i} className="card h-48 bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 border-dashed">
          <FileSignature className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="font-medium">No forms created yet</p>
          <p className="text-sm mt-1">Click the button above to build your first dynamic form.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.data?.map((form: any) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={form.id} 
              className="card group hover:border-primary-300 dark:hover:border-primary-700 transition-all flex flex-col"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className={`badge text-xs ${form.isActive ? 'badge-success' : 'badge-neutral'}`}>
                    {form.isActive ? 'Active' : 'Draft'}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="btn-icon text-slate-400 hover:text-primary-600" title="Share link">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="btn-icon text-slate-400 hover:text-emerald-600" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1" title={form.name}>
                  {form.name}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                  {form.description || 'No description provided.'}
                </p>
                
                <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    <LayoutTemplate className="w-3.5 h-3.5" />
                    {form.schema?.fields?.length || 0} Fields
                  </span>
                  <span className="flex items-center gap-1.5">
                    {form.isPublic ? 'Public' : 'Internal'}
                  </span>
                </div>
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center rounded-b-xl">
                <span className="text-xs text-slate-400">
                  Updated {new Date(form.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(form)} className="btn-secondary py-1.5 px-3 text-xs">
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Builder
                  </button>
                  <button onClick={() => handleDelete(form.id, form.name)} className="btn-icon text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <FormBuilderModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            form={editingForm}
            onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['forms'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Simple Form Builder Modal ──────────────────────────────────────────────

const FIELD_TYPES = [
  { type: 'text', label: 'Short Text', icon: AlignLeft },
  { type: 'textarea', label: 'Long Text', icon: AlignLeft },
  { type: 'number', label: 'Number', icon: CheckSquare },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'file', label: 'File Upload', icon: ImageIcon },
];

function FormBuilderModal({ isOpen, onClose, form, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: form?.name || '',
    description: form?.description || '',
    isPublic: form?.isPublic !== false,
    isActive: form?.isActive !== false,
  });

  // Schema state
  const [fields, setFields] = useState<any[]>(form?.schema?.fields || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addField = (type: string) => {
    setFields([...fields, { 
      id: Math.random().toString(36).substr(2, 9),
      type, 
      label: 'New Field', 
      required: false,
      placeholder: ''
    }]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, key: string, value: any) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = form 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/forms/${form.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/forms`;
      
      const method = form ? 'put' : 'post';
      
      await axios[method](url, {
        ...formData,
        schema: { fields }
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      
      toast.success(`Form ${form ? 'updated' : 'created'} successfully`);
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
        className="card w-full max-w-5xl shadow-2xl h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold font-display">
              {form ? 'Edit Form Builder' : 'New Form Builder'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-icon text-slate-400">✕</button>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Sidebar - Field Palette */}
          <div className="w-full md:w-64 border-r border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/20 overflow-y-auto shrink-0">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Add Fields</h3>
            <div className="space-y-2">
              {FIELD_TYPES.map(ft => (
                <button 
                  key={ft.type}
                  type="button"
                  onClick={() => addField(ft.type)}
                  className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary-500 hover:text-primary-600 transition-colors text-left"
                >
                  <ft.icon className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                  <span className="text-sm font-medium">{ft.label}</span>
                  <Plus className="w-4 h-4 ml-auto text-slate-300" />
                </button>
              ))}
            </div>
          </div>

          {/* Main Area - Form Settings & Field Canvas */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Form Metadata */}
              <div className="card p-6 border-t-4 border-t-primary-500 shadow-sm">
                <input
                  type="text"
                  placeholder="Form Title"
                  className="w-full text-2xl font-bold font-display bg-transparent border-b border-transparent hover:border-slate-200 focus:border-primary-500 outline-none pb-2 transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <textarea
                  placeholder="Form Description..."
                  className="w-full mt-2 text-sm bg-transparent border-b border-transparent hover:border-slate-200 focus:border-primary-500 outline-none pb-2 transition-colors resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
                <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-primary-600"
                      checked={formData.isPublic} onChange={e => setFormData({...formData, isPublic: e.target.checked})} />
                    <span className="text-sm">Public Form</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-primary-600"
                      checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
              </div>

              {/* Field Canvas */}
              <div className="space-y-4">
                <AnimatePresence>
                  {fields.map((field, index) => (
                    <motion.div 
                      key={field.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="card p-5 border-l-4 border-l-blue-500 shadow-sm group relative"
                    >
                      <button 
                        onClick={() => removeField(field.id)}
                        className="absolute -right-3 -top-3 w-8 h-8 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            placeholder="Question / Field Label"
                            className="w-full text-base font-semibold bg-slate-50 dark:bg-slate-800 border border-transparent hover:border-slate-300 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 rounded px-3 py-2 outline-none transition-colors"
                            value={field.label}
                            onChange={(e) => updateField(field.id, 'label', e.target.value)}
                          />
                          <div className="flex items-center gap-4">
                            <select 
                              className="input py-1.5 text-sm w-48 bg-slate-50 dark:bg-slate-800"
                              value={field.type}
                              onChange={(e) => updateField(field.id, 'type', e.target.value)}
                            >
                              {FIELD_TYPES.map(ft => <option key={ft.type} value={ft.type}>{ft.label}</option>)}
                            </select>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 rounded text-primary-600"
                                checked={field.required} onChange={e => updateField(field.id, 'required', e.target.checked)} />
                              <span className="text-sm text-slate-600">Required</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {fields.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400">
                    <p>Drag or click fields from the left to build your form</p>
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 rounded-b-xl">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting || !formData.name} className="btn-primary">
            {isSubmitting ? 'Saving...' : 'Save Form Schema'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
