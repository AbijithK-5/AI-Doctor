import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Calendar,
  ChevronDown,
  ClipboardCheck,
  Database,
  FileBarChart,
  FileText,
  GitCompare,
  Grid3X3,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { UserRole } from '../types';

interface NavItem {
  label: string;
  to: string;
  icon: React.FC<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

function getNavGroups(role: UserRole): NavGroup[] {
  if (role === 'patient') {
    return [
      {
        title: 'Patient Care',
        items: [
          { label: 'Patient Dashboard', to: '/patient/dashboard', icon: LayoutDashboard },
          { label: 'Patient Profile', to: '/patient/profile', icon: UserCircle },
          { label: 'Symptom Checker', to: '/patient/symptoms', icon: Activity },
          { label: 'AI Doctor', to: '/patient/ai-doctor', icon: Bot },
          { label: 'Human Doctor Consultation', to: '/patient/consultations', icon: Stethoscope },
          { label: 'Appointments', to: '/patient/appointments', icon: Calendar },
          { label: 'Medical Reports', to: '/patient/reports', icon: FileText },
          { label: 'Health History', to: '/patient/history', icon: History },
        ],
      },
      {
        title: 'Comparison Engine',
        items: [
          { label: 'Comparison Dashboard', to: '/comparison/dashboard', icon: GitCompare },
          { label: 'Detailed Report', to: '/comparison/report', icon: FileBarChart },
        ],
      },
      {
        title: 'Account',
        items: [
          { label: 'Notifications', to: '/notifications', icon: Bell },
          { label: 'Settings', to: '/settings', icon: Settings },
        ],
      },
    ];
  }
  if (role === 'doctor') {
    return [
      {
        title: 'Clinical Practice',
        items: [
          { label: 'Doctor Dashboard', to: '/doctor/dashboard', icon: LayoutDashboard },
          { label: 'Doctor Profile', to: '/doctor/profile', icon: UserCircle },
          { label: 'Patient Management', to: '/doctor/patients', icon: Users },
          { label: 'Clinical Assessment', to: '/doctor/assessment', icon: ClipboardCheck },
          { label: 'Review AI Assessment', to: '/doctor/ai-review', icon: Bot },
        ],
      },
      {
        title: 'Comparison & Analytics',
        items: [
          { label: 'Comparison Dashboard', to: '/comparison/dashboard', icon: GitCompare },
          { label: 'Detailed Report', to: '/comparison/report', icon: FileBarChart },
          { label: 'Accuracy Analysis', to: '/research/accuracy', icon: BarChart3 },
          { label: 'Disagreement Analysis', to: '/research/disagreements', icon: AlertTriangle },
        ],
      },
      {
        title: 'Account',
        items: [
          { label: 'Notifications', to: '/notifications', icon: Bell },
          { label: 'Settings', to: '/settings', icon: Settings },
        ],
      },
    ];
  }
  if (role === 'researcher') {
    return [
      {
        title: 'Research Workspace',
        items: [
          { label: 'Research Dashboard', to: '/research/dashboard', icon: LayoutDashboard },
          { label: 'Dataset Management', to: '/research/datasets', icon: Database },
          { label: 'Research Reports', to: '/research/reports', icon: FileBarChart },
        ],
      },
      {
        title: 'Accuracy & Explainability',
        items: [
          { label: 'Accuracy Analysis', to: '/research/accuracy', icon: BarChart3 },
          { label: 'Confusion Matrix', to: '/research/confusion-matrix', icon: Grid3X3 },
          { label: 'Disagreement Analysis', to: '/research/disagreements', icon: AlertTriangle },
          { label: 'Explainable AI', to: '/research/explainable-ai', icon: Sparkles },
          { label: 'Comparison Dashboard', to: '/comparison/dashboard', icon: GitCompare },
          { label: 'Detailed Report', to: '/comparison/report', icon: FileText },
        ],
      },
      {
        title: 'Account',
        items: [
          { label: 'Notifications', to: '/notifications', icon: Bell },
          { label: 'Settings', to: '/settings', icon: Settings },
        ],
      },
    ];
  }
  // admin
  return [
    {
      title: 'Administration',
      items: [
        { label: 'Admin Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'User Management', to: '/admin/users', icon: Users },
        { label: 'Doctor Management', to: '/admin/doctors', icon: UserCheck },
        { label: 'System Management', to: '/admin/system', icon: Server },
        { label: 'Admin Analytics', to: '/admin/analytics', icon: FileBarChart },
      ],
    },
    {
      title: 'Platform Intelligence',
      items: [
        { label: 'Comparison Dashboard', to: '/comparison/dashboard', icon: GitCompare },
        { label: 'Detailed Report', to: '/comparison/report', icon: FileText },
        { label: 'Accuracy Analysis', to: '/research/accuracy', icon: BarChart3 },
        { label: 'Confusion Matrix', to: '/research/confusion-matrix', icon: Grid3X3 },
        { label: 'Disagreement Analysis', to: '/research/disagreements', icon: AlertTriangle },
        { label: 'Explainable AI', to: '/research/explainable-ai', icon: Sparkles },
        { label: 'Dataset Management', to: '/research/datasets', icon: Database },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Notifications', to: '/notifications', icon: Bell },
        { label: 'Settings', to: '/settings', icon: Settings },
      ],
    },
  ];
}

export const AppLayout: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => {
  const { user, unreadNotifications, logoutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  if (!user) return null;

  const groups = getNavGroups(user.role);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0B2D52] text-white">
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link to={user.role === 'researcher' ? '/research/dashboard' : `/${user.role}/dashboard`} onClick={() => setSidebarOpen(false)}>
          <BrandLogo light />
        </Link>
        <button className="lg:hidden text-white/70 hover:text-white" onClick={() => setSidebarOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sky-300/75">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-gradient-to-r from-[#0D9488] to-[#0E7490] text-white shadow-sm'
                        : 'text-sky-100/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.to === '/notifications' && unreadNotifications > 0 && (
                      <span className="ml-auto bg-emerald-400 text-[#0B2D52] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {unreadNotifications}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="bg-white/10 rounded-xl p-3 text-xs text-sky-100 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
            <ShieldCheck className="w-4 h-4" />
            <span>Clinical Safety Guard</span>
          </div>
          <p className="text-[11px] text-sky-200/80 leading-relaxed">
            AI outputs are educational decision-support only. Human doctors remain authoritative.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F4F8FC]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-68 shrink-0 sticky top-0 h-screen no-print">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-7 py-3.5 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-lg sm:text-xl text-[#0B2D52] truncate">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Demo Mode Active
            </span>

            <Link
              to="/notifications"
              className="relative p-2 rounded-xl bg-slate-100/80 hover:bg-sky-50 text-slate-700 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-sky-300 bg-white transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0B2D52] to-[#0D9488] text-white font-bold text-xs flex items-center justify-center">
                  {user.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-[#0B2D52] max-w-[130px] truncate">{user.full_name}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">{user.role}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-20">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="text-sm font-semibold text-[#0B2D52] truncate">{user.full_name}</div>
                      <div className="text-xs text-slate-500 truncate">{user.email}</div>
                    </div>
                    <Link
                      to="/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-sky-50"
                    >
                      <Settings className="w-4 h-4 text-slate-500" /> Settings & Security
                    </Link>
                    <Link
                      to="/notifications"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-sky-50"
                    >
                      <Bell className="w-4 h-4 text-slate-500" /> Notifications
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 mt-1 border-t border-slate-100"
                    >
                      <LogOut className="w-4 h-4" /> Secure Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto print-full">
          {child