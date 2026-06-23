'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, Clock, Send, ChevronRight, FileText , AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ApprovalsPage() {
  const [viewMode, setViewMode] = useState<'my_requests' | 'pending_action'>('pending_action');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['approvals', viewMode, searchTerm],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/approvals`, {
        params: { search: searchTerm, viewMode },
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return 'badge-neutral';
      case 'IN_PROGRESS': return 'badge-warning';
      case 'APPROVED': return 'badge-success';
      case 'REJECTED': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  const openActionModal = (approval: any) => {
    setSelectedApproval(approval);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedApproval(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-primary-500" />
            Approval Workflow Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage multi-stage approvals for leaves, events, budgets, and documents
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex text-sm w-full sm:w-auto">
            <button 
              className={`flex-1 sm:px-4 py-1.5 rounded-md font-medium transition-colors ${viewMode === 'pending_action' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => setViewMode('pending_action')}
            >
              Pending Action
            </button>
            <button 
              className={`flex-1 sm:px-4 py-1.5 rounded-md font-medium transition-colors ${viewMode === 'my_requests' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => setViewMode('my_requests')}
            >
              My Requests
            </button>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search approvals..."
              className="input pl-9 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={openCreateModal} className="btn-primary w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4" />
            <span>New Request</span>
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
            <Send className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-medium">No approvals found</p>
            <p className="text-sm mt-1">
              {viewMode === 'pending_action' ? 'You have no pending requests to approve.' : 'You have not submitted any approval requests.'}
            </p>
          </div>
        ) : (
          data?.data?.map((approval: any) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={approval.id} 
              className="card group hover:border-primary-300 dark:hover:border-primary-700 transition-colors flex flex-col"
            >
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-semibold text-slate-500 mb-1 block">
                      {approval.type.replace('_', ' ')}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg line-clamp-1">{approval.title}</h3>
                  </div>
                  <span className={`badge text-[10px] shrink-0 ${getStatusBadge(approval.status)}`}>
                    {approval.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold font-display shrink-0">
                    {approval.requester.firstName[0]}{approval.requester.lastName[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-200">
                      {approval.requester.firstName} {approval.requester.lastName}
                    </span>
                    <span className="text-xs">{approval.requester.role.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 flex flex-wrap items-center gap-2">
                  {/* Workflow Stages Timeline */}
                  {approval.stages.map((stage: any, index: number) => (
                    <div key={stage.id} className="flex items-center text-xs">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${
                        stage.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' :
                        stage.status === 'REJECTED' ? 'bg-red-50 text-red-700 dark:bg-red-900/20' :
                        approval.currentStage === stage.stageOrder ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 border border-amber-200' :
                        'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}>
                        {stage.status === 'APPROVED' ? <CheckCircle2 className="w-3 h-3" /> :
                         stage.status === 'REJECTED' ? <XCircle className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
                        <span className="font-medium">{stage.approverRole.replace('_', ' ')}</span>
                      </div>
                      {index < approval.stages.length - 1 && (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-3 px-5 rounded-b-xl flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  Requested {new Date(approval.createdAt).toLocaleDateString()}
                </span>
                <button 
                  onClick={() => openActionModal(approval)} 
                  className={`btn-secondary py-1.5 px-4 text-xs ${viewMode === 'pending_action' ? 'btn-primary' : ''}`}
                >
                  {viewMode === 'pending_action' ? 'Review & Act' : 'View Details'}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <ApprovalModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            approval={selectedApproval}
            viewMode={viewMode}
            onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['approvals'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Modal Component ──────────────────────────────────────────────

function ApprovalModal({ isOpen, onClose, approval, viewMode, onSuccess }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For Creation Mode
  const [formData, setFormData] = useState({
    type: 'EVENT_PROPOSAL',
    title: '',
    description: '',
    stages: [{ approverRole: 'HOD', stageOrder: 1 }, { approverRole: 'SUPER_ADMIN', stageOrder: 2 }]
  });

  // For Action Mode
  const [actionComments, setActionComments] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/approvals`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      
      toast.success('Approval request submitted successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !actionComments) {
      toast.error('Comments are required for rejection');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/approvals/${approval.id}/action`, {
        action,
        comments: actionComments
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      
      toast.success(`Request ${action.toLowerCase()}d successfully`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!approval) {
    // ── Create Mode UI ──────────────────────────────────────────────
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="card w-full max-w-2xl shadow-2xl my-8 flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 sticky top-0 rounded-t-xl z-10">
            <h2 className="text-xl font-bold font-display">Initiate Approval Request</h2>
            <button type="button" onClick={onClose} className="btn-icon text-slate-400">✕</button>
          </div>
          
          <form onSubmit={handleCreate} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Request Type</label>
                <select required className="input" 
                  value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="EVENT_PROPOSAL">Event Proposal</option>
                  <option value="LEAVE">Leave Request</option>
                  <option value="BUDGET">Budget Approval</option>
                  <option value="DOCUMENT">Document Verification</option>
                </select>
              </div>
              <div>
                <label className="label">Title</label>
                <input required type="text" className="input" placeholder="e.g. Budget for Tech Fest"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="label">Description / Justification</label>
              <textarea required className="input resize-none" rows={4} placeholder="Please provide detailed justification..."
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Workflow Routing</h3>
              <p className="text-sm text-slate-600">Standard routing: HOD ➔ Principal/Super Admin.</p>
              {/* In a real app, this would be dynamic. For now, static representation */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm font-medium">1. Head of Department (HOD)</div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <div className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm font-medium">2. Principal / Admin</div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── Action/Review Mode UI ──────────────────────────────────────────────
  const activeStage = approval.stages.find((s: any) => s.stageOrder === approval.currentStage);
  const canAct = viewMode === 'pending_action' && activeStage?.status === 'PENDING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card w-full max-w-3xl shadow-2xl my-8 flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 sticky top-0 rounded-t-xl z-10">
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" /> Review Request
          </h2>
          <button type="button" onClick={onClose} className="btn-icon text-slate-400">✕</button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono font-semibold text-slate-500 block mb-1">REQUEST TITLE</span>
                <p className="font-bold text-lg">{approval.title}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono font-semibold text-slate-500 block mb-1">REQUESTER</span>
                <p className="font-medium text-sm">{approval.requester.firstName} {approval.requester.lastName} <span className="text-slate-500 font-normal">({approval.requester.role.replace('_', ' ')})</span></p>
              </div>
              <div>
                <span className="text-[10px] font-mono font-semibold text-slate-500 block mb-1">DEPARTMENT</span>
                <p className="font-medium text-sm">{approval.department?.name || 'Institution Level'}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono font-semibold text-slate-500 block mb-1">SUBMITTED ON</span>
                <p className="font-medium text-sm">{new Date(approval.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono font-semibold text-slate-500 block mb-1">JUSTIFICATION / DESCRIPTION</span>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-700 dark:text-slate-300 min-h-[150px] whitespace-pre-wrap">
                {approval.description || 'No description provided.'}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <h3 className="text-sm font-bold mb-4">Workflow History</h3>
            <div className="space-y-4">
              {approval.stages.map((stage: any) => (
                <div key={stage.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      stage.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                      stage.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                      approval.currentStage === stage.stageOrder ? 'bg-amber-100 text-amber-600' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {stage.status === 'APPROVED' ? <CheckCircle2 className="w-4 h-4" /> :
                       stage.status === 'REJECTED' ? <XCircle className="w-4 h-4" /> :
                       <Clock className="w-4 h-4" />}
                    </div>
                    <div className="w-0.5 h-full bg-slate-100 dark:bg-slate-800 mt-2"></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-sm">{stage.approverRole.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-500 mb-1">
                      {stage.status === 'PENDING' && approval.currentStage === stage.stageOrder ? 'Waiting for action' : 
                       stage.status === 'PENDING' ? 'Pending next step' : 
                       `Actioned by ${stage.approver?.firstName || 'User'} on ${new Date(stage.actionDate).toLocaleDateString()}`}
                    </p>
                    {stage.comments && (
                      <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs mt-1 border border-slate-100 dark:border-slate-700">
                        <span className="font-semibold block mb-0.5">Comments:</span>
                        {stage.comments}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {canAct && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-xl mt-4 border">
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-500 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Your Action Required
              </h3>
              <textarea 
                className="input resize-none mb-3" 
                rows={3} 
                placeholder="Add comments (Required for rejection)..."
                value={actionComments}
                onChange={(e) => setActionComments(e.target.value)}
              />
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => handleAction('REJECT')} 
                  disabled={isSubmitting} 
                  className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Reject Request
                </button>
                <button 
                  onClick={() => handleAction('APPROVE')} 
                  disabled={isSubmitting} 
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve Request
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

