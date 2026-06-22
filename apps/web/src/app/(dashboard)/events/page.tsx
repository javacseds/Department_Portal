'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Calendar as CalendarIcon, Clock, MapPin, Users, Target, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  
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
    queryKey: ['events', searchTerm, statusFilter],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events`, {
        params: { search: searchTerm, status: statusFilter },
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully');
    }
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the event "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (event: any) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PLANNED': return 'badge-neutral';
      case 'APPROVED': return 'badge-primary';
      case 'IN_PROGRESS': return 'badge-warning';
      case 'COMPLETED': return 'badge-success';
      case 'CANCELLED': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary-500" />
            Event Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Plan, organize, and track department events, workshops, and seminars
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select 
            className="input w-full sm:w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="APPROVED">Approved</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search events..."
              className="input pl-9 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={openCreateModal} className="btn-primary w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(null).map((_, i) => (
            <div key={i} className="card p-6 h-48 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))
        ) : data?.data?.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-slate-500 border-dashed">
            <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-medium">No events found</p>
            <p className="text-sm mt-1">Create an event to start planning.</p>
          </div>
        ) : (
          data?.data?.map((event: any) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={event.id} 
              className="card group hover:border-primary-300 dark:hover:border-primary-700 transition-all flex flex-col"
            >
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    <span className={`badge text-[10px] ${getStatusBadge(event.status)}`}>
                      {event.status.replace('_', ' ')}
                    </span>
                    <span className="badge badge-neutral text-[10px]">{event.type}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(event)} className="btn-icon text-slate-400 hover:text-primary-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(event.id, event.title)} className="btn-icon text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-lg mb-1" title={event.title}>
                    {event.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                    {event.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span>
                      {new Date(event.startDate).toLocaleDateString()} to {new Date(event.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  )}
                  {event.targetAudience && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{event.targetAudience}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 px-5 border-t border-slate-100 dark:border-slate-800 rounded-b-xl flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Budget: {event.budget ? `₹${event.budget.toLocaleString()}` : 'N/A'}</span>
                </div>
                {event.department && (
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {event.department.shortName}
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <EventModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            event={editingEvent}
            departments={deptsData?.data || []}
            onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['events'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Event Modal Component ──────────────────────────────────────────────

const EVENT_TYPES = ['Workshop', 'Seminar', 'Conference', 'Guest Lecture', 'FDP', 'Hackathon', 'Cultural', 'Sports', 'Other'];
const EVENT_LEVELS = ['College', 'State', 'National', 'International'];

function EventModal({ isOpen, onClose, event, departments, onSuccess }: any) {
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    type: event?.type || EVENT_TYPES[0],
    level: event?.level || EVENT_LEVELS[0],
    departmentId: event?.departmentId || '',
    startDate: event?.startDate ? formatDateForInput(event.startDate) : '',
    endDate: event?.endDate ? formatDateForInput(event.endDate) : '',
    venue: event?.venue || '',
    organizer: event?.organizer || '',
    targetAudience: event?.targetAudience || '',
    budget: event?.budget || '',
    status: event?.status || 'PLANNED',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = event 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${event.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events`;
      
      const method = event ? 'put' : 'post';
      
      const payload: any = { ...formData };
      if (payload.budget) payload.budget = Number(payload.budget);
      else delete payload.budget;
      
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      
      toast.success(`Event ${event ? 'updated' : 'created'} successfully`);
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
        className="card w-full max-w-3xl shadow-2xl my-8"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-xl">
          <h2 className="text-xl font-bold font-display">
            {event ? 'Edit Event Details' : 'Plan New Event'}
          </h2>
          <button onClick={onClose} className="btn-icon text-slate-400">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">Basic Details</h3>
            
            <div>
              <label className="label">Event Title</label>
              <input required type="text" className="input" placeholder="e.g. National Conference on AI"
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Event Type</label>
                <select required className="input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  {EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Event Level</label>
                <select className="input" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                  {EVENT_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={3} placeholder="Brief description of the event objectives..."
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">Schedule & Logistics</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Date & Time</label>
                <input required type="datetime-local" className="input" 
                  value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div>
                <label className="label">End Date & Time</label>
                <input required type="datetime-local" className="input" 
                  value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Venue</label>
                <input type="text" className="input" placeholder="e.g. Main Auditorium"
                  value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
              </div>
              <div>
                <label className="label">Target Audience</label>
                <input type="text" className="input" placeholder="e.g. 3rd & 4th Year CSE Students"
                  value={formData.targetAudience} onChange={e => setFormData({...formData, targetAudience: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">Administration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Host Department</label>
                <select className="input" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                  <option value="">College Level / Institutional</option>
                  {departments.map((dept: any) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Estimated Budget (₹)</label>
                <input type="number" className="input" placeholder="0" min="0"
                  value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Organizer Name</label>
                <input type="text" className="input" placeholder="e.g. Dr. John Doe"
                  value={formData.organizer} onChange={e => setFormData({...formData, organizer: e.target.value})} />
              </div>
              <div>
                <label className="label">Current Status</label>
                <select className="input font-medium" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="PLANNED">Planned</option>
                  <option value="APPROVED">Approved</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
