import React, { useState } from 'react';
import { HelpCircle, KeyRound, Lock, Save, ShieldCheck } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../lib/api';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logoutUser } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(
    user?.notification_preferences || {
      email_alerts: true,
      appointment_reminders: true,
      ai_completion: true,
      comparison_ready: true,
    }
  );
  const [privacyPrefs, setPrivacyPrefs] = useState<Record<string, boolean>>(
    user?.privacy_settings || {
      allow_deidentified_research: true,
      share_reports_with_assigned_doctor: true,
    }
  );
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' });

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/auth/settings', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName,
          phone_number: phone,
          notification_preferences: notifPrefs,
          privacy_settings: privacyPrefs,
        }),
      });
      await refreshUser();
      showToast('Account, notification, and privacy preferences saved.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(passwords),
      });
      showToast('Password updated successfully.', 'success');
      setPasswords({ current_password: '', new_password: '' });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <AppLayout title="Settings & Security" subtitle="Manage account details, password, privacy controls, notification preferences, and policies">
      <div className="grid lg:grid-cols-2 gap-6 max-w-5xl">
        <form onSubmit={handleSaveAccount} className="healthcare-card p-6 space-y-5">
          <h2 className="font-display font-bold text-lg text-[#0B2D52]">Account, Notification &amp; Privacy Settings</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-xs font-bold uppercase text-slate-500">Notification Preferences</div>
            {Object.entries(notifPrefs).map(([key, val]) => (
              <label key={key} className="flex items-center justify-between text-sm text-slate-700 cursor-pointer">
                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                <input
                  type="checkbox"
                  checked={val}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, [key]: e.target.checked })}
                  className="accent-teal-600 w-4 h-4"
                />
              </label>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Privacy Settings
            </div>
            {Object.entries(privacyPrefs).map(([key, val]) => (
              <label key={key} className="flex items-center justify-between text-sm text-slate-700 cursor-pointer">
                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                <input
                  type="checkbox"
                  checked={val}
                  onChange={(e) => setPrivacyPrefs({ ...privacyPrefs, [key]: e.target.checked })}
                  className="accent-teal-600 w-4 h-4"
                />
              </label>
            ))}
          </div>

          <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0B2D52] to-[#0D9488] text-white text-sm font-semibold flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Save Preferences
          </button>
        </form>

        <div className="space-y-6">
          <form onSubmit={handlePasswordChange} className="healthcare-card p-6 space-y-4">
            <h2 className="font-display font-bold text-lg text-[#0B2D52] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-teal-600" /> Change Password &amp; Session Security
            </h2>
            <input
              type="password"
              required
              placeholder="Current Password"
              value={passwords.current_password}
              onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="New Password (min 6 chars)"
              value={passwords.new_password}
              onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#0B2D52] text-white text-sm font-semibold">
                Update Password
              </button>
              <button type="button" onClick={logoutUser} className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 text-sm font-semibold hover:bg-rose-50">
                Sign Out Current Session
              </button>
            </div>
          </form>

          <div className="healthcare-card p-6 space-y-3 text-xs text-slate-600 leading-relaxed">
            <h3 className="font-display font-bold text-sm text-[#0B2D52] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" /> Terms, Privacy Policy &amp; Help Support
            </h3>
            <p>
              <strong>Clinical Safety Terms:</strong> AI Decision-Support outputs are strictly educational and never override a licensed doctor&apos;s medical authority.
            </p>
            <p>
              <strong>Privacy Policy:</strong> Medical records and uploaded PDFs are role-restricted and audit logged. Researchers receive strictly de-identified records.
            </p>
            <p className="flex items-center gap-1.5 text-[#0B2D52] font-semibold pt-1">
              <HelpCircle className="w-4 h-4 text-teal-600" /> Support Desk: support@aivshumandoctor.demo
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
