'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Settings, Save, Globe, Palette, Shield, Upload, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  useEffect(() => {
    if (data?.data) {
      const initialData: Record<string, string> = {};
      data.data.forEach((item: any) => {
        initialData[item.key] = item.value;
      });
      // Set defaults if not present
      if (!initialData['COLLEGE_NAME']) initialData['COLLEGE_NAME'] = 'Smart College';
      if (!initialData['COLLEGE_WEBSITE']) initialData['COLLEGE_WEBSITE'] = 'https://example.edu';
      if (!initialData['SUPPORT_EMAIL']) initialData['SUPPORT_EMAIL'] = 'support@example.edu';
      if (!initialData['THEME_PRIMARY_COLOR']) initialData['THEME_PRIMARY_COLOR'] = '#4f46e5';
      if (!initialData['MAX_UPLOAD_SIZE_MB']) initialData['MAX_UPLOAD_SIZE_MB'] = '10';
      if (!initialData['MAINTENANCE_MODE']) initialData['MAINTENANCE_MODE'] = 'false';
      
      setFormData(initialData);
      setHasChanges(false);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any[]) => {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Settings updated successfully');
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    }
  });

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const payload = Object.keys(formData).map(key => ({
      key,
      value: formData[key],
      isPublic: ['COLLEGE_NAME', 'COLLEGE_WEBSITE', 'THEME_PRIMARY_COLOR', 'MAINTENANCE_MODE'].includes(key)
    }));
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return <div className="p-8 animate-pulse text-center">Loading settings...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary-500" />
            System Customization
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure global institutional parameters and themes
          </p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className={`btn-primary ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Save className="w-4 h-4 mr-2" /> 
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 shrink-0 space-y-2">
          {[
            { id: 'general', label: 'General Info', icon: Globe },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'system', label: 'System & Security', icon: Shield },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3">Institutional Information</h3>
                
                <div className="grid gap-6 max-w-2xl">
                  <div>
                    <label className="label">College/Institution Name</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={formData['COLLEGE_NAME'] || ''} 
                      onChange={e => handleChange('COLLEGE_NAME', e.target.value)} 
                    />
                    <p className="text-xs text-slate-500 mt-1">Displayed on the login screen and public portals.</p>
                  </div>
                  
                  <div>
                    <label className="label">Official Website</label>
                    <input 
                      type="url" 
                      className="input" 
                      value={formData['COLLEGE_WEBSITE'] || ''} 
                      onChange={e => handleChange('COLLEGE_WEBSITE', e.target.value)} 
                    />
                  </div>

                  <div>
                    <label className="label">Support/Admin Email</label>
                    <input 
                      type="email" 
                      className="input" 
                      value={formData['SUPPORT_EMAIL'] || ''} 
                      onChange={e => handleChange('SUPPORT_EMAIL', e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3">Branding & Theme</h3>
                
                <div className="grid gap-6 max-w-2xl">
                  <div>
                    <label className="label">Primary Theme Color (Hex)</label>
                    <div className="flex gap-3 items-center">
                      <input 
                        type="color" 
                        className="w-10 h-10 rounded cursor-pointer" 
                        value={formData['THEME_PRIMARY_COLOR'] || '#4f46e5'} 
                        onChange={e => handleChange('THEME_PRIMARY_COLOR', e.target.value)} 
                      />
                      <input 
                        type="text" 
                        className="input flex-1 font-mono uppercase" 
                        value={formData['THEME_PRIMARY_COLOR'] || '#4f46e5'} 
                        onChange={e => handleChange('THEME_PRIMARY_COLOR', e.target.value)} 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">College Logo URL</label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        className="input flex-1" 
                        placeholder="https://example.com/logo.png"
                        value={formData['LOGO_URL'] || ''} 
                        onChange={e => handleChange('LOGO_URL', e.target.value)} 
                      />
                      <button className="btn-secondary whitespace-nowrap">
                        <Upload className="w-4 h-4 mr-2" /> Upload
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3">System Controls</h3>
                
                <div className="grid gap-6 max-w-2xl">
                  <div>
                    <label className="label">Max File Upload Size (MB)</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={formData['MAX_UPLOAD_SIZE_MB'] || '10'} 
                      onChange={e => handleChange('MAX_UPLOAD_SIZE_MB', e.target.value)} 
                    />
                  </div>

                  <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-900/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-amber-800 dark:text-amber-500">Maintenance Mode</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1">
                          Restrict access to all users except Super Admins.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData['MAINTENANCE_MODE'] === 'true'}
                          onChange={e => handleChange('MAINTENANCE_MODE', e.target.checked ? 'true' : 'false')}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
