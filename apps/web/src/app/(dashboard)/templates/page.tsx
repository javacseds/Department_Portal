'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Plus, Search, Edit2, Trash2, FileText, Download, Play, 
  Code2, FileSpreadsheet, File
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['templates', searchTerm],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates`, {
        params: { search: searchTerm },
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted successfully');
    }
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete template "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (template: any) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const openGenerateModal = (template: any) => {
    setSelectedTemplate(template);
    setIsGenerateModalOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'excel': return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'docx': return <File className="w-5 h-5 text-blue-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Code2 className="w-6 h-6 text-primary-500" />
            Template Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build dynamic HTML templates for automated PDF and Document generation
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search templates..."
              className="input pl-9 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={openCreateModal} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(null).map((_, i) => (
            <div key={i} className="card p-6 h-48 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))
        ) : data?.data?.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-slate-500 border-dashed">
            <Code2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-medium">No templates found</p>
            <p className="text-sm mt-1">Create a template to start generating documents.</p>
          </div>
        ) : (
          data?.data?.map((template: any) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={template.id} 
              className="card group hover:border-primary-300 dark:hover:border-primary-700 transition-colors flex flex-col"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {getTypeIcon(template.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{template.name}</h3>
                      <p className="text-xs font-mono text-slate-500 uppercase">{template.type} FORMAT</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(template)} className="btn-icon text-slate-400 hover:text-primary-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(template.id, template.name)} className="btn-icon text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[40px] mb-4">
                  {template.description || 'No description.'}
                </p>

                <div className="flex flex-wrap gap-2">
                  {template.variables.slice(0, 3).map((v: string) => (
                    <span key={v} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-mono">
                      {`{{${v}}}`}
                    </span>
                  ))}
                  {template.variables.length > 3 && (
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-medium">
                      +{template.variables.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center rounded-b-xl">
                <span className={`text-xs ${template.isGlobal ? 'text-primary-600 font-medium' : 'text-slate-500'}`}>
                  {template.isGlobal ? 'Global Template' : 'Departmental'}
                </span>
                <button onClick={() => openGenerateModal(template)} className="btn-primary py-1.5 px-4 text-xs group-hover:shadow-md transition-shadow">
                  <Play className="w-3 h-3 mr-1" /> Generate
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <TemplateBuilderModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            template={editingTemplate}
            onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['templates'] });
            }}
          />
        )}
        {isGenerateModalOpen && (
          <GenerateDocumentModal
            isOpen={isGenerateModalOpen}
            onClose={() => setIsGenerateModalOpen(false)}
            template={selectedTemplate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Template Builder Modal ──────────────────────────────────────────────

function TemplateBuilderModal({ isOpen, onClose, template, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    type: template?.type || 'pdf',
    content: template?.content || '<h1>Hello {{name}}</h1>',
    variables: template?.variables?.join(', ') || 'name',
    isGlobal: template?.isGlobal !== false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = template 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/${template.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates`;
      
      const method = template ? 'put' : 'post';
      
      const payload = {
        ...formData,
        variables: formData.variables.split(',').map((v: string) => v.trim()).filter((v: string) => v)
      };
      
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      
      toast.success(`Template ${template ? 'updated' : 'created'} successfully`);
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
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-xl font-bold font-display">
            {template ? 'Edit Template' : 'New Template'}
          </h2>
          <button onClick={onClose} className="btn-icon text-slate-400">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Settings Pane */}
            <div className="w-full lg:w-1/3 border-r border-slate-100 dark:border-slate-800 p-5 overflow-y-auto space-y-4">
              <div>
                <label className="label">Template Name</label>
                <input required type="text" className="input" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div>
                <label className="label">Output Format</label>
                <select className="input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="pdf">PDF Document (.pdf)</option>
                  <option value="docx">Word Document (.docx)</option>
                </select>
              </div>

              <div>
                <label className="label">Variables (Comma separated)</label>
                <input required type="text" className="input font-mono text-sm" placeholder="studentName, rollNumber, date"
                  value={formData.variables} onChange={e => setFormData({...formData, variables: e.target.value})} />
                <p className="text-xs text-slate-500 mt-1">Use these in content like {'{{studentName}}'}</p>
              </div>
              
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={3}
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-primary-600"
                    checked={formData.isGlobal} onChange={e => setFormData({...formData, isGlobal: e.target.checked})} />
                  <span className="text-sm font-medium">Global Template (All Depts)</span>
                </label>
              </div>
            </div>

            {/* Code Editor Pane */}
            <div className="flex-1 flex flex-col bg-[#1e1e1e]">
              <div className="px-4 py-2 bg-[#2d2d2d] flex justify-between items-center shrink-0">
                <span className="text-xs font-mono text-slate-300">HTML Content</span>
                <span className="text-xs font-mono text-emerald-400">Tailwind CSS Supported</span>
              </div>
              <textarea
                className="flex-1 w-full p-4 bg-[#1e1e1e] text-slate-300 font-mono text-sm focus:outline-none resize-none"
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                spellCheck={false}
              />
            </div>
            
          </div>
          
          <div className="flex justify-end gap-3 p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Generate Document Modal ──────────────────────────────────────────────

function GenerateDocumentModal({ isOpen, onClose, template }: any) {
  const [payload, setPayload] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/${template.id}/generate`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
          responseType: 'blob' // Important for downloading files
        }
      );

      // Create a blob URL and download it
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = template.type === 'pdf' ? 'pdf' : 'docx';
      link.setAttribute('download', `${template.name.replace(/\s+/g, '_')}_Generated.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Document generated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to generate document');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold">Generate Document</h2>
          <button onClick={onClose} className="btn-icon text-slate-400">✕</button>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg border border-primary-100 dark:border-primary-800">
            <p className="text-sm text-primary-700 dark:text-primary-300 font-medium">
              Template: {template.name} ({template.type.toUpperCase()})
            </p>
          </div>

          <div className="space-y-3">
            {template.variables.map((variable: string) => (
              <div key={variable}>
                <label className="label capitalize">{variable.replace(/([A-Z])/g, ' $1').trim()}</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder={`Enter ${variable}...`}
                  value={payload[variable] || ''}
                  onChange={e => setPayload({...payload, [variable]: e.target.value})}
                />
              </div>
            ))}

            {template.variables.length === 0 && (
              <p className="text-sm text-slate-500 italic text-center py-4">
                This template has no dynamic variables.
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="button" onClick={handleGenerate} disabled={isGenerating} className="btn-primary">
            {isGenerating ? 'Generating...' : (
              <><Download className="w-4 h-4 mr-2" /> Download File</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
