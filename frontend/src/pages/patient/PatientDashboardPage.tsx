import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Bot,
  Calendar,
  FileText,
  GitCompare,
  HeartPulse,
  Stethoscope,
} from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';

export const PatientDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/patient/dashboard')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout title="Patient Dashboard" subtitle="Loading your healthcare summary...">
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const stats = data?.stats || {};
  const prof = data?.profile_summary || {};

  return (
    <AppLayout
      title={`Welcome, ${data?.welcome_name || 'Patient'}`}
      subtitle="Your personal AI decision-support, doctor consultations, and side-by-side comparison hub"
    >
      <div className="space-y-6">
        {/* Quick Action Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-[#0B2D52] to-[#0D9488] text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
          <div>
            <h2 className="font-display text-xl font-bold">Start a Dual-Opinion Health Evaluation</h2>
            <p className="text-sm text-sky-100 mt-1">
              Log your symptoms for an educational AI summary, then consult a licensed physician for side-by-side comparison.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/patient/symptoms"
              className="px-4 py-2.5 rounded-xl bg-white text-[#0B2D52] text-sm font-bold hover:bg-sky-50 transition-colors"
            >
              + Enter Symptoms
            </Link>
            <Link
              to="/patient/consultations"
              className="px-4 py-2.5 rounded-xl bg-white/15 border border-white/25 text-white text-sm font-semibold hover:bg-white/25 transition-colors"
            >
              Book Human Doctor
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Consultations', value: stats.total_consultations ?? 0, icon: Stethoscope, color: 'text-teal-700 bg-teal-50' },
            { label: 'AI Assessments', value: stats.ai_assessments ?? 0, icon: Bot, color: 'text-sky-700 bg-sky-50' },
            { label: 'Doctor Consultations', value: stats.doctor_consultations ?? 0, icon: HeartPulse, color: 'text-emerald-700 bg-emerald-50' },
            { label: 'Medical Reports', value: stats.medical_reports ?? 0, icon: FileText, color: 'text-indigo-700 bg-indigo-50' },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="healthcare-card p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-display font-extrabold text-[#0B2D52]">{card.value}</div>
                  <div className="text-xs font-medium text-slate-500">{card.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile & Health Summary */}
          <div className="healthcare-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-[#0B2D52]">Patient Profile Summary</h3>
              <Link to="/patient/profile" className="text-xs font-semibold text-teal-700 hover:underline">Edit</Link>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#F4F8FC]">
                <div className="text-xs text-slate-500">Age</div>
                <div className="font-bold text-[#0B2D52]">{prof.age ?? '—'}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#F4F8FC]">
                <div className="text-xs text-slate-500">Gender</div>
                <div className="font-bold text-[#0B2D52]">{prof.gender || '—'}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#F4F8FC]">
                <div className="text-xs text-slate-500">Blood Group</div>
                <div className="font-bold text-rose-600">{prof.blood_group || '—'}</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Existing Conditions:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(data?.health_history_summary?.existing_conditions || []).length > 0 ? (
                    data.health_history_summary.existing_conditions.map((c: string) => (
                      <span key={c} className="px-2.5 py-0.5 rounded-full text-xs bg-sky-50 text-sky-800 border border-sky-200">{c}</span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None recorded</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Known Allergies:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(data?.health_history_summary?.known_allergies || []).length > 0 ? (
                    data.health_history_summary.known_allergies.map((a: string) => (
                      <span key={a} className="px-2.5 py-0.5 rounded-full text-xs bg-rose-50 text-rose-700 border border-rose-200">{a}</span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None recorded</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Latest Comparison Results */}
          <div className="healthcare-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-[#0B2D52] flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-teal-600" /> Latest Comparisons
              </h3>
              <Link to="/comparison/dashboard" className="text-xs font-semibold text-teal-700 hover:underline">View All</Link>
            </div>
            {(data?.latest_comparisons || []).length === 0 ? (
              <p className="text-sm text-slate-500">No completed AI vs Doctor comparisons yet.</p>
            ) : (
              <div className="space-y-3">
                {data.latest_comparisons.map((cmp: any) => (
                  <Link
                    key={cmp.id}
                    to={`/comparison/report/${cmp.id}`}
                    className="block p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B2D52]">Doctor: {cmp.doctor_diagnosis}</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          cmp.agreement_status === 'agree'
                            ? 'bg-emerald-100 text-emerald-800'
                            : cmp.agreement_status === 'partial_agree'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {cmp.agreement_score}% {cmp.agreement_status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">AI Top: {cmp.ai_top_condition}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Appointments & Recent Activity */}
          <div className="healthcare-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-[#0B2D52] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-600" /> Upcoming Appointments
              </h3>
              <Link to="/patient/appointments" className="text-xs font-semibold text-teal-700 hover:underline">Manage</Link>
            </div>
            {(data?.upcoming_appointments || []).length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming appointments scheduled.</p>
            ) : (
              <div className="space-y-2.5">
                {data.upcoming_appointments.map((appt: any) => (
                  <div key={appt.id} className="p-3 rounded-xl bg-[#F4F8FC] border border-sky-100">
                    <div className="font-semibold text-sm text-[#0B2D52]">{appt.doctor_name}</div>
                    <div className="text-xs text-teal-700">{appt.speciality} • {appt.consultation_type}</div>
                    <div className="text-xs text-slate-500 mt-1">{new Date(appt.scheduled_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Recent Activity
              </div>
              <div className="space-y-2">
                {(data?.recent_activities || []).slice(0, 4).map((act: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 truncate pr-2">{act.title}</span>
                    <span className="text-slate-400 shrink-0">{new Date(act.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
              <Link to="/patient/history" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline mt-3">
                Full Health History <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
