'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, GraduationCap, Shield, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import { setCredentials } from '@/lib/store/slices/authSlice';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`,
        { email: data.email, password: data.password },
        { withCredentials: true }
      );

      if (res.data.success) {
        dispatch(setCredentials({
          user: res.data.data.user,
          accessToken: res.data.data.accessToken,
        }));
        localStorage.setItem('accessToken', res.data.data.accessToken);
        toast.success(`Welcome back, ${res.data.data.user.firstName}!`);
        router.push('/dashboard');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a1a6e 0%, #4338CA 35%, #7C3AED 70%, #9333EA 100%)',
        }}
      >
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full mix-blend-overlay opacity-20"
              style={{
                width: `${200 + i * 80}px`,
                height: `${200 + i * 80}px`,
                background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
                left: `${[10, 60, 5, 70, 30][i]}%`,
                top:  `${[15, 60, 70, 10, 40][i]}%`,
              }}
              animate={{
                x: [0, 20, -20, 0],
                y: [0, -20, 20, 0],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">CDDAS</h1>
              <p className="text-white/60 text-xs">College Documentation System</p>
            </div>
          </div>

          {/* Main copy */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <h2 className="text-5xl font-black leading-tight font-display">
                Smart College<br />
                <span className="text-yellow-300">Documentation</span><br />
                at Your Fingertips
              </h2>
              <p className="text-white/70 text-lg mt-4 max-w-md leading-relaxed">
                One centralized platform to manage all department documentation, approvals, reports, faculty, and student records.
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {['NAAC Reports', 'NBA Accreditation', 'AICTE Compliance', 'Document Generator', 'File Manager', 'Approval Workflow'].map((f) => (
                <span
                  key={f}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/20"
                >
                  ✦ {f}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {[
              { value: '50+', label: 'Modules' },
              { value: '7', label: 'User Roles' },
              { value: '100%', label: 'Secure' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-3xl font-black text-yellow-300">{stat.value}</div>
                <div className="text-white/70 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── Right Panel — Login Form ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 sm:p-10"
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">CDDAS</span>
          </div>

          <div className="card p-8 sm:p-10">
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-4">
                <Shield className="w-3.5 h-3.5" />
                Secure Login
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-display">
                Welcome Back
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
                Sign in to access your department portal
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label className="label" htmlFor="login-email">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                    placeholder="your.email@college.edu"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="label" htmlFor="login-password">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`input pl-10 pr-11 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter your password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    id="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
                )}
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="remember-me"
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    {...register('rememberMe')}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
                </label>
                <a
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                id="login-submit"
                disabled={isSubmitting}
                className="btn-primary w-full justify-center py-3 text-base"
                whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Demo Credentials
              </p>
              <div className="space-y-1 text-xs text-amber-700 dark:text-amber-400 font-mono">
                <p>📧 superadmin@cddas.edu</p>
                <p>🔑 Admin@123456</p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            © {new Date().getFullYear()} CDDAS — Smart College Documentation System
          </p>
        </div>
      </motion.div>
    </div>
  );
}
