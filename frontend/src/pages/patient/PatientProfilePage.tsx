import React, { useEffect, useState } from 'react';
import { Save, UserCircle } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export const PatientProfilePage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userInfo, setUserInfo] = useState<any>({});
  const [form, setForm] = useState({
    age: '',
    gender: '',
    blood_group: '',
    height_cm: '',
    weight_kg: '',
    known_allergies: '',
    existing_conditions: '',
    current_medications: '',
    family_medical_history: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
  });

  useEffect(() => {
    apiRequest('/api/patient/profile')
      .then((res) => {
        setUserInfo(res.user || {});
        setForm({
          age: res.age ?? '',
          gender: res.gender || '',
          blood_group: res.blood_group || '',
          height_cm: res.height_cm ?? '',
          weight_kg: res.weight_kg ?? '',
          known_allergies: (res.known_allergies || []).join(', '),
          existing_conditions: (res.existing_conditions || []).join(', '),
          current_medications: (res.current_medications || []).join(', '),
          family_medical_history: res.family_medical_history || '',
          emergency_contact_name: res.emergency_contact_name || '',
          emergency_contact_phone: res.emergency_contact_phone || '',
          emergency_contact_relation: res.emergency_contact_relation || '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
    try {
      await apiRequest('/api/patient/profile', {
        method: 'PUT',
        body: JSON.stringify({
          age: form.age ? Number(form.age) : null,
          gender: form.gender || null,
          blood_group: form.blood_group || null,
          height_cm: form.height_cm ? Number(form.height_cm) : null,
          weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
          known_allergies: splitList(form.known_allergies),
          existing_conditions: splitList(form.existing_conditions),
          current_medications: splitList(form.current_medications),
          family_medical_history: form.family_medical_history || null,
          emergency_contact_name: form.emergency_contact_name || null,
          emergency_contact_phone: form.emergency_contact_phone || null,
          emergency_contact_relation: form.emergency_contact_relation || null,
        }),
      });
      showToast('Patient health profile saved successfully.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Patient Profile" subtitle="Manage your personal medical baseline, allergies, medications, and emergency contact">
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="healthcare-card p-6 sm:p-8 space-y-6 max-w-4xl">
          <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0B2D52] flex items-center justify-center">
              <UserCircle className="w-9 h-9 text-teal-700" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-[#0B2D52]">{userInfo.full_name}</h2>
              <p className="text-sm text-slate-500">{userInfo.email} • {userInfo.phone_number || 'No phone on file'}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age (years)</label>
              <input type="number" min={0} max={130} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
                <option value="">Select</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
              <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
              <input type="number" step="0.1" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
              <input type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Known Allergies (comma-separated)</label>
              <input type="text" value={form.known_allergies} onChange={(e) => setForm({ ...form, known_allergies: e.target.value })} placeholder="e.g., Penicillin, Peanuts" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Existing Medical Conditions (comma-separated)</label>
              <input type="text" value={form.existing_conditions} onChange={(e) => setForm({ ...form, existing_conditions: e.target.value })} placeholder="e.g., Asthma, Hypertension" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Medications (comma-separated)</label>
              <input type="text" value={form.current_medications} onChange={(e) => setForm({ ...form, current_medications: e.target.value })} placeholder="e.g., Metformin 500mg, Albuterol" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Family Medical History</label>
              <input type="text" value={form.family_medical_history} onChange={(e) => setForm({ ...form, family_medical_history: e.target.value })} placeholder="e.g., Father: Hypertension" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="font-display font-bold text-sm text-[#0B2D52] mb-3">Emergency Contact</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contact Name</label>
                <input type="text" value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contact Phone</label>
                <input type="text" value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Relationship</label>
                <input type="text" value={form.emergency_contact_relation} onChange={(e) => setForm({ ...form, emergency_contact_relation: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0B2D52] to-[#0D9488] text-white font-semibold text-sm flex items-center gap-2 shadow-sm hover:opacity-95"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}
    </AppLayout>
  );
};
