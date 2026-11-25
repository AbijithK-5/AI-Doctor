import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, LogIn, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';

const DEMO_ACCOUNTS: { label: string; email: string; role: UserRole; desc: string }[] = [
  { label: 'Patient Demo', email: 'patient@demo.com', role: 'patient', desc: 'Aarav Sharma (with AI & Comparison history)' },
  { label: 'Doctor Demo', email: 'doctor@demo.com', role: 'doctor', desc: 'Dr. Elena Vance (Pulmonologist)' },
  { label: 'Researcher Demo', email: 'researcher@demo.com', role: 'researcher', desc: 'Dr. Liam O’Connor (Analytics & XAI)' },
  { label: 'Admin Demo', email: 'admin@demo.com', role: 'admin', desc: 'Sophia Carter (Platform Admin)' },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('patient@demo.com');
  const [password, setPassword] = useState('Demo@123');
  const [role, setRole] = useState<UserRole>('patient');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role, remember_me: rememberMe }),
      });
      loginUser(res.access_token, res.user, rememberMe);
      showToast(`Signed in as ${res.user.full_name}`, 'success');
      navigate(res.user.role === 'researcher' ? '/research/dashboard' : `/${res.user.role}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail }),
      });
      showToast(res.message, 'info');
      setForgotOpen(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF3FB] via-[#F4F8FC] to-[#E6F7F5] py-10 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl grid md:grid-cols-5 gap-6 items-stretch">
        {/* Left: Login Form */}
        <div className="md:col-span-3 healthcare-card p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <Link to="/"><BrandLogo /></Link>
              <Link to="/register" className="text-xs font-semibold text-teal-700 hover:underline">
                Create Account
              </Link>
            </div>

            <h1 className="font-display text-2xl font-bold text-[#0B2D52]">Welcome Back</h1>
            <p className="text-sm text-slate-600 mt-1 mb-6">
              Sign in with your role credentials to access the Smart Healthcare Comparison Platform.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Role</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['patient', 'doctor', 'researcher', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        role === r
                          ? 'bg-[#0B2D52] text-white border-[#0B2D52]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-teal-600 w-4 h-4"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotOpen(true);
                  }}
                  className="text-teal-700 font-semibold hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0B2D52] to-[#0D9488] text-white font-semibold text-sm shadow-md hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                {loading ? 'Signing In...' : 'Sign In Securely'}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>JWT session protection with role-based permissions &amp; audit logging.</span>
          </div>
        </div>

        {/* Right: One-Click Demo Credential Selector */}
        <div className="md:col-span-2 bg-[#0B2D52] text-white rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <span className="inline-block px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-3">
              Demo Mode Credentials
            </span>
            <h2 className="font-display text-lg font-bold mb-2">Quick Role Switcher</h2>
            <p className="text-xs text-sky-200/85 mb-4 leading-relaxed">
              Click any demo profile below to autofill its email, role, and password (<code className="text-emerald-300">Demo@123</code>) for instant evaluation.
            </p>
            <div className="space-y-2.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Demo@123');
                    setRole(acc.role);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{acc.label}</span>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-200 font-bold">
                      {acc.role}
                    </span>
                  </div>
                  <div className="text-xs text-sky-200 mt-1">{acc.desc}</div>
                  <div className="text-[11px] text-emerald-300 mt-0.5">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-sky-200/75 mt-5">
            Demo records are pre-seeded with realistic assessments, consultations, and comparisons.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-[#0B2D52] font-display font-bold text-lg">
              <KeyRound className="w-5 h-5 text-teal-600" /> Reset Password
            </div>
            <p className="text-sm text-slate-600">
              Enter your registered email address to request password reset instructions.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0B2D52] text-white text-sm font-semibold"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
   