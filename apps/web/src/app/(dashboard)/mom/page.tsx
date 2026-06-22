'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Users, Calendar, Clock, MapPin, FileText, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function MeetingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<any>(null);
  
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

  const { data, isLoading } = useQuery({
    queryKey: ['meetings', searchTerm, statusFilter],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/mom`, {
        params: { search: searchTerm, status: statusFilter },
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/mom/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting deleted successfully');
    }
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the meeting "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (meeting: any) => {
    setEditingMeeting(meeting);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingMeeting(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-500" />
            Meetings & MOM
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Schedule meetings, set agendas, and track Minutes of Meeting
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select 
            className="input w-full sm:w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search meetings..."
              className="input pl-9 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={openCreateModal} className="btn-primary w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {isLoading ? (
          Array(4).fill(null).map((_, i) => (
            <div key={i} className="card p-6 h-48 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))
        ) : data?.data?.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-slate-500 border-dashed">
            <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-medium">No meetings scheduled</p>
            <p className="text-sm mt-1">Click the button above to schedule your first meeting.</p>
          </div>
        ) : (
          data?.data?.map((meeting: any) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={meeting.id} 
              className="card group hover:border-primary-300 dark:hover:border-primary-700 transition-colors flex flex-col"
            >
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{meeting.title}</h3>
                    {meeting.department && (
                      <span className="text-xs text-slate-500">{meeting.department.name}</span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`badge text-[10px] ${
                      meeting.status === 'COMPLETED' ? 'badge-success' : 
                      meeting.status === 'CANCELLED' ? 'badge-danger' : 'badge-primary'
                    }`}>
                      {meeting.status}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(meeting)} className="btn-icon text-slate-400 hover:text-primary-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(meeting.id, meeting.title)} className="btn-icon text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-500 shrink-0" />
                    <span>{new Date(meeting.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{meeting.time}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="truncate">{meeting.venue || 'Virtual Meeting'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Agenda
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                    {meeting.agenda}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-4 rounded-b-xl flex justify-between items-center">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {meeting.attendees?.length || 0} Expected
                  </span>
                </div>
                {meeting.status === 'COMPLETED' ? (
                  <button onClick={() => openEditModal(meeting)} className="btn-secondary py-1.5 px-3 text-xs bg-white dark:bg-slate-800 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> View MOM
                  </button>
                ) : (
                  <button onClick={() => openEditModal(meeting)} className="btn-primary py-1.5 px-3 text-xs">
                    Update MOM
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <MeetingModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            meeting={editingMeeting}
            departments={deptsData?.data || []}
            facultyList={facultyData?.data || []}
            onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['meetings'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Modal Component ──────────────────────────────────────────────

function MeetingModal({ isOpen, onClose, meeting, departments, facultyList, onSuccess }: any) {
  const [formData, setFormData] = useState({
    title: meeting?.title || '',
    date: meeting?.date ? new Date(meeting.date).toISOString().split('T')[0] : '',
    time: meeting?.time || '10:00',
    venue: meeting?.venue || '',
    agenda: meeting?.agenda || '',
    minutes: meeting?.minutes || '',
    departmentId: meeting?.departmentId || '',
    status: meeting?.status || 'SCHEDULED',
    attendees: meeting?.attendees || [],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = meeting 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mom/${meeting.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mom`;
      
      const method = meeting ? 'put' : 'post';
      
      const payload: any = { ...formData };
      if (!payload.departmentId) delete payload.departmentId;
      
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      
      toast.success(`Meeting ${meeting ? 'updated' : 'scheduled'} successfully`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCompleted = formData.status === 'COMPLETED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="card w-full max-w-4xl shadow-2xl my-8 flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 sticky top-0 rounded-t-xl z-10">
          <h2 className="text-xl font-bold font-display">
            {meeting ? 'Meeting Details & MOM' : 'Schedule New Meeting'}
          </h2>
          <button type="button" onClick={onClose} className="btn-icon text-slate-400">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-1/2 p-6 space-y-5 border-r border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold border-b pb-2">Scheduling Details</h3>
            
            <div>
              <label className="label">Meeting Title</label>
              <input required type="text" className="input" placeholder="e.g. Department Faculty Meeting"
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date</label>
                <input required type="date" className="input" 
                  value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div>
                <label className="label">Time</label>
                <input required type="time" className="input" 
                  value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="label">Venue / Link</label>
              <input type="text" className="input" placeholder="e.g. Board Room or Google Meet Link"
                value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Department</label>
                <select className="input text-sm" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                  <option value="">Institution Level</option>
                  {departments.map((dept: any) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input font-medium" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="label">Agenda</label>
              <textarea required className="input resize-none" rows={4} placeholder="List items to be discussed..."
                value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} />
            </div>
          </div>

          <div className="w-full lg:w-1/2 p-6 space-y-5 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="text-sm font-semibold border-b pb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Minutes of Meeting (MOM)
            </h3>
            
            {isCompleted ? (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg text-sm border border-blue-100 dark:border-blue-800">
                  Meeting marked as completed. Please finalize the Minutes of Meeting below.
                </div>
                <div>
                  <label className="label">Minutes / Resolutions Passed</label>
                  <textarea className="input resize-none font-mono text-sm" rows={12} placeholder="1. Discussed...&#10;2. Resolved to...&#10;3. Action items..."
                    value={formData.minutes} onChange={e => setFormData({...formData, minutes: e.target.value})} />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <FileText className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
                <p>Change status to <b>COMPLETED</b> to write the Minutes of Meeting.</p>
              </div>
            )}
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 rounded-b-xl z-10">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : 'Save Meeting'}
            </button>
          </div>
        </form>
        {/* Spacer for absolute footer */}
        <div className="h-[72px]"></div>
      </motion.div>
    </div>
  );
}
