import React, { useEffect, useState } from 'react';
import { Activity, FileText, GitCompare, ShieldAlert, Stethoscope, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiRequest('/api/admin/dashboard').then(setData);
  }, []);

  const s = data?.stats || {};

  return (
    <AppLayout title="Admin Dashboard" subtitle="Platform-wide oversight of users, doctor verifications, consultations, and usage analytics">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Patients', value: s.total_patients ?? 0, icon: Users },
            { label: 'Total Doctors', value: s.total_doctors ?? 0, icon: Stethoscope },
            { label: 'Total Researchers', value: s.total_researchers ?? 0, icon: Activity },
            { label: 'Pending Doctor Verif.', value: s.pending_doctor_verifications ?? 0, icon: ShieldAlert },
            { label: 'Total Consultations', value: s.total_consultations ?? 0, icon: Stethoscope },
            { label: 'Total AI Assessments', value: s.total_assessments ?? 0, icon: Activity },
            { label: 'Total Medical Reports', value: s.total_reports ?? 0, icon: FileText },
            { label: 'Comparisons Generated', value: s.total_comparisons ?? 0, icon: GitCompare },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="healthcare-card p-5 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-teal-700 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-display font-extrabold text-[#0B2D52]">{card.value}</div>
                  <div className="text-xs text-slate-500">{card.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 healthcare-card p-6 space-y-4">
            <h2 className="font-display font-bold text-[#0B2D52]">Application Usage Analytics</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.usage_analytics || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ai_assessments" name="AI Assessments" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="consultations" name="Doctor Consultations" fill="#0B2D52" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="comparisons" name="Comparisons" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="healthcare-card p-6 space-y-3">
            <h2 className="font-display font-bold text-[#0B2D52]">Recent Security &amp; Audit Events</h2>
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {(data?.recent_audit_logs || []).map((log: any) => (
                <div key={log.id} className="p-3 rounded-xl bg-[#F4F8FC] border border-sky-100 text-xs">
                  <div className="font-bold text-[#0B2D52]">{log.action}</div>
                  <div className="text-slate-500">{log.actor_role || 'system'} • {log.resource_type}</div>
                  <div className="text-[11px] text-slate-400">{new Date(log.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
