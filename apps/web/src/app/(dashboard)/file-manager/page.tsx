'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { 
  FolderOpen, UploadCloud, Search, FileText, Image as ImageIcon, 
  FileSpreadsheet, File as FileIcon, Trash2, Download, ExternalLink,
  Filter, Grid, List, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function FileManagerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['files', searchTerm, categoryFilter],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/files`, {
        params: { search: searchTerm, category: categoryFilter },
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      if (categoryFilter) formData.append('category', categoryFilter);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/files/upload-multiple`, 
        formData, 
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress(percentCompleted);
          }
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('Files uploaded successfully');
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload files');
      setIsUploading(false);
      setUploadProgress(0);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/files/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File deleted successfully');
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setIsUploading(true);
    uploadMutation.mutate(acceptedFiles);
  }, [uploadMutation, categoryFilter]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
    return <FileIcon className="w-8 h-8 text-slate-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary-500" />
            File Manager
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Securely store, organize, and share department files
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 flex">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-primary-600' : 'text-slate-500'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-primary-600' : 'text-slate-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search files..."
              className="input pl-9 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative overflow-hidden
          ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-900 dark:text-white">
              {isDragActive ? 'Drop files here...' : 'Click or drag files to upload'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Supports Images, PDFs, Word, Excel (Max 50MB per file)
            </p>
          </div>
        </div>

        {/* Upload Progress Overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center z-20 backdrop-blur-sm"
            >
              <p className="text-primary-600 font-medium mb-4">Uploading files... {uploadProgress}%</p>
              <div className="w-64 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Files Display */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">Recent Files</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="text-sm bg-transparent border-none text-slate-600 dark:text-slate-400 outline-none cursor-pointer"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="events">Events</option>
              <option value="reports">Reports</option>
              <option value="circulars">Circulars</option>
              <option value="faculty">Faculty Docs</option>
              <option value="students">Student Docs</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
            {Array(6).fill(null).map((_, i) => (
              <div key={i} className="card aspect-square bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <FolderOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-medium">This folder is empty</p>
            <p className="text-sm mt-1">Upload some files to see them here.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {data?.data?.map((file: any) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={file.id} 
                className="card group relative overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
              >
                {/* Thumbnail Area */}
                <div className="aspect-square bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center p-4">
                  {file.thumbnailUrl ? (
                    <img 
                      src={`${process.env.NEXT_PUBLIC_API_URL}${file.thumbnailUrl}`} 
                      alt={file.originalName}
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    getFileIcon(file.mimeType)
                  )}
                </div>

                {/* Info Area */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-900 dark:text-white truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {formatFileSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                  <a 
                    href={`${process.env.NEXT_PUBLIC_API_URL}${file.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    title="Open/Download"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => {
                      if(window.confirm('Delete this file permanently?')) {
                        deleteMutation.mutate(file.id);
                      }
                    }}
                    className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Size</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((file: any) => (
                  <tr key={file.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <span className="font-medium text-sm truncate max-w-xs">{file.originalName}</span>
                      </div>
                    </td>
                    <td className="text-sm text-slate-500">{formatFileSize(file.fileSize)}</td>
                    <td className="text-sm">{file.uploader?.firstName} {file.uploader?.lastName}</td>
                    <td className="text-sm text-slate-500">{new Date(file.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={`${process.env.NEXT_PUBLIC_API_URL}${file.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon text-slate-400 hover:text-primary-600"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => {
                            if(window.confirm('Delete this file permanently?')) {
                              deleteMutation.mutate(file.id);
                            }
                          }}
                          className="btn-icon text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
