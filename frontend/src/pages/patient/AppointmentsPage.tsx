import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, RefreshCw, XCircle } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export const AppointmentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [newTime, setNewTime] = useState('2026-12-08T11:00');

  const load = async () => {
    const data = await apiRequest('/api/patient/appointments');
    setAppointments(data);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = appointments.filter((a) => {
    if (tab === 'upcoming') return a.status === 'scheduled' || a.status === 'rescheduled';
    if (tab === 'completed') return a.status === 'completed';
    return true;
  });

  const handleCancel = async (id: number) => {
    try {
      await apiRequest(`/api/patient/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' }),
      });
      showToast('Appointment cancelled.', 'info');
      await load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleId) return;
    try {
      await apiRequest(`/api/patient/appointments/${rescheduleId}`, {
        method: 'PUT',
        body: JSON.stringify({ scheduled_at: new Date(newTime).toISOString(), status: 'rescheduled' }),
      });
      showToast('Appointment rescheduled successfully.', 'success');
      setRescheduleId(null);
      await load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <AppLayout title="Appointment Management" subtitle="Book, reschedule, cancel, and track your physician consultations">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(['upcoming', 'completed', 'all'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize ${
                  tab === t ? 'bg-[#0B2D52] text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Link
            to="/patient/consultations"
            className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700"
          >
            + Book New Appointment
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <div className="healthcare-card p-8 col-span-2 text-center text-slate-500">
              No appointments in this category.
            </div>
          ) : (
            filtered.map((a) => (
              <div key={a.id} className="healthcare-card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-bold text-[#0B2D52]">{a.doctor_name}</h3>
                    <div className="text-xs font-semibold text-teal-700">{a.speciality} • {a.hospital_name}</div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    a.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : a.status === 'cancelled'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-sky-100 text-sky-800'
                  }`}>
                    {a.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-sky-600" /> {new Date(a.scheduled_at).toLocaleString()}</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-teal-600" /> Mode: {a.consultation_type.replace('_', ' ')}</div>
                  {a.reason && <div><strong>Reason:</strong> {a.reason}</div>}
                </div>

                {(a.status === 'scheduled' || a.status === 'rescheduled') && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setRescheduleId(a.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#0B2D52] hover:bg-sky-50 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                    </button>
                    <button
                      onClick={() => handleCancel(a.id)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {rescheduleId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form onSubmit={handleReschedule} className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-[#0B2D52]">Reschedule Appointment #{rescheduleId}</h3>
            <input
              type="datetime-local"
              required
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRescheduleId(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#0B2D52] text-white text-sm font-semibold">Save New Time</button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
};
