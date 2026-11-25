import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export const DoctorManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState<any[]>([]);

  const load = async () => {
    const res = await apiRequest('/api/admin/doctors');
    setDoctors(res);
  };

  useEffect(() => {
    load();
  }, []);

  const handleVerify = async (doctorProfileId: number, decision: 'verified' | 'rejected') => {
    try {
      await apiRequest(`/api/admin/doctors/${doctorProfileId}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          review_notes: decision === 'verified' ? 'Medical license verified by Admin.' : 'Registration credentials could not be verified.',
        }),
      });
      showToast(`Doctor verification marked as ${decision}.`, decision === 'verified' ? 'success' : 'info');
      await load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <AppLayout title="Doctor Management & Credential Verification" subtitle="Verify medical licenses, approve or reject physician accounts, and monitor clinical activity">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {doctors.map((d) => (
          <div key={d.doctor_profile_id} className="healthcare-card p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#0B2D52]">{d.full_name}</h3>
                  <div className="text-xs font-semibold text-teal-700">{d.medical_speciality}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                  d.verification_status === 'verified'
                    ? 'bg-emerald-100 text-emerald-800'
                    : d.verification_status === 'rejected'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {d.verification_status}
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div><strong>License #:</strong> {d.registration_number}</div>
                <div><strong>Qualification:</strong> {d.qualification}</div>
                <div><strong>Hospital:</strong> {d.hospital_name || 'Partner Center'}</div>
                <div><strong>Activity:</strong> {d.completed_consultations} / {d.total_consultations} consultations completed</div>
                <div><strong>Availability:</strong> {(d.availability_schedule?.days || []).join(', ')} ({d.availability_schedule?.hours})</div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleVerify(d.doctor_profile_id, 'verified')}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => handleVerify(d.doctor_profile_id, 'rejected')}
                className="flex-1 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 flex items-center justify-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
      {doctors.some((d) => d.verification_status === 'pending') && (
        <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Pending doctor credential requests require administrator verification review.</span>
        </div>
      )}
    </AppLayout>
  );
};
