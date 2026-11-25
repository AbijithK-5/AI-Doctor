import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, ClipboardList, GitCompare, Users } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';

export const DoctorDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiRequest('/api/doctor/dashboard').then(setData);
  }, []);

  const stats = data?.stats || {};

  return (
    <AppLayout title={`Welcome, ${data?.doctor_name || 'Doctor'}`} subtitle="Clinical consultations, independent diagnostic reviews, and AI comparison queue">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: 'Total Patients', value: stats.total_patients ?? 0, icon: Users },
            { label: 'Upcoming Appts', value: stats.upcoming_appointments ?? 0, icon: Calendar },
            { label: 'Pending Consults', value: stats.pending_consultations ?? 0, icon: ClipboardList },
            { label: 'Completed Consults', value: stats.completed_consultations ?? 0, icon: CheckCircle2 },
            { label: 'Pending Reviews', value: stats.pending_assessment_reviews ?? 0, icon: ClipboardList },
            { label: 'Comparison Requests', value: stats.comparison_requests ?? 0, icon: GitCompare },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="healthcare-card p-4 space-y-1">
                <Icon className="w-5 h-5 text-teal-600" />
                <div className="text-2xl font-display font-extrabold text-[#0B2D52]">{c.value}</div>
                <div className="text-xs text-slate-500 font-medium">{c.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="healthcare-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-[#0B2D52]">Upcoming Appointments</h2>
              <Link to="/doctor/assessment" className="text-xs font-semibold text-teal-700 hover:underline">Open Assessment Queue →</Link>
            </div>
            {(data?.upcoming_appointments || []).length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming appointments.</p>
            ) : (
              <div className="space-y-2.5">
                {data.upcoming_appointments.map((a: any) => (
                  <div key={a.id} className="p-3.5 rounded-xl bg-[#F4F8FC] border border-sky-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-[#0B2D52]">{a.patient_name}</div>
                      <div className="text-xs text-slate-600">{a.reason || 'Consultation'} • {a.consultation_type}</div>
                    </div>
                    <div className="text-xs font-semibold text-teal-700">{new Date(a.scheduled_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="healthcare-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-[#0B2D52]">Recent Patient Activity &amp; Comparison Queue</h2>
              <Link to="/doctor/ai-review" className="text-xs font-semibold text-teal-700 hover:underline">Review AI Suggestions →</Link>
            </div>
            {(data?.recent_activity || []).map((act: any) => (
              <div key={act.consultation_id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-[#0B2D52]">{act.patient_name} (Consultation #{act.consultation_id})</div>
                  <div className="text-xs text-slate-500">
                    {act.has_ai_assessment ? 'AI Assessment attached for comparison' : 'Standard clinical review'}
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                  act.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {act.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
