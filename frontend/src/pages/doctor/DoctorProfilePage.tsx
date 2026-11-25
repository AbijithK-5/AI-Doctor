import React, { useEffect, useState } from 'react';
import { Save, ShieldAlert, ShieldCheck, Stethoscope } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export const DoctorProfilePage: React.FC = () => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    qualification: '',
    medical_speciality: '',
    years_of_experience: 0,
    hospital_name: '',
    contact_info: '',
    bio: '',
    availability_days: 'Mon, Tue, Wed, Thu, Fri',
    availability_hours: '09:00 - 17:00',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest('/api/doctor/profile').then((res) => {
      setProfile(res);
      setForm({
        qualification: res.qualification || '',
        medical_speciality: res.medical_speciality || '',
        years_of_experience: res.years_of_experience || 0,
        hospital_name: res.hospital_name || '',
        contact_info: res.contact_info || '',
        bio: res.bio || '',
        availability_days: (res.availability_schedule?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).join(', '),
        availability_hours: res.availability_schedule?.hours || '09:00 - 17:00',
      });
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/api/doctor/profile', {
        method: 'PUT',
        body: JSON.stringify({
          qualification: form.qualification,
          medical_speciality: form.medical_speciality,
          years_of_experience: Number(form.years_of_experience),
          hospital_name: form.hospital_name,
          contact_info: form.contact_info,
          bio: form.bio,
          availability_schedule: {
            days: form.availability_days.split(',').map((s) => s.trim()).filter(Boolean),
            hours: form.availability_hours,
          },
        }),
      });
      showToast('Doctor profile updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Doctor Profile" subtitle="Manage your medical qualifications, registration status, hospital affiliation, and schedule">
      {profile && (
        <form onSubmit={handleSave} className="healthcare-card p-6 sm:p-8 max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-teal-700 flex items-center justify-center">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-[#0B2D52]">{profile.full_name}</h2>
                <p className="text-xs text-slate-500">Registration #: <strong>{profile.registration_number}</strong> • {profile.email}</p>
              </div>
            </div>

            {profile.verification_status === 'verified' ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" /> Credential Verification: VERIFIED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <ShieldAlert className="w-4 h-4" /> Credential Verification: {profile.verification_status.toUpperCase()}
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Qualification</label>
              <input type="text" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Medical Speciality</label>
              <input type="text" value={form.medical_speciality} onChange={(e) => setForm({ ...form, medical_speciality: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Years of Experience</label>
              <input type="number" min={0} value={form.years_of_experience} onChange={(e) => setForm({ ...form, years_of_experience: Number(e.target.value) })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hospital / Clinic</label>
              <input type="text" value={form.hospital_name} onChange={(e) => setForm({ ...form, hospital_name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Information</label>
              <input type="text" value={form.contact_info} onChange={(e) => setForm({ ...form, contact_info: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Availability Hours</label>
              <input type="text" value={form.availability_hours} onChange={(e) => setForm({ ...form, availability_hours: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Availability Days (comma-separated)</label>
            <input type="text" value={form.availability_days} onChange={(e) => setForm({ ...form, availability_days: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Bio</label>
            <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0B2D52] to-[#0D9488] text-white font-semibold text-sm flex items-center gap-2">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Doctor Profile'}
            </button>
          </div>
        </form>
      )}
    </AppLayout>
  );
};
