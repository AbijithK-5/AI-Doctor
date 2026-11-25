import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';

const COLORS = ['#0B2D52', '#0D9488', '#0EA5E9', '#F59E0B'];

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiRequest('/api/admin/analytics').then(setData);
  }, []);

  const totals = data?.totals || {};

  return (
    <AppLayout title="Admin Reports & Analytics" subtitle="Comprehensive platform statistics across users, doctors, AI assessments, and comparisons">
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Users', value: totals.users ?? 0 },
            { label: 'Appointments', value: totals.appointments ?? 0 },
            { label: 'Consultations', value: totals.consultations ?? 0 },
            { label: 'AI Assessments', value: totals.ai_assessments ?? 0 },
            { label: 'Comparisons', value: totals.comparisons ?? 0 },
            { label: 'Datasets', value: totals.datasets ?? 0 },
          ].map((k) => (
            <div key={k.label} className="healthcare-card p-4">
              <div className="text-xs text-slate-500">{k.label}</div>
              <div className="text-2xl font-display font-extrabold text-[#0B2D52] mt-1">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="healthcare-card p-6 space-y-3">
            <h2 className="font-display font-bold text-[#0B2D52]">User Role Distribution</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.user_distribution || []} dataKey="count" nameKey="role" outerRadius={95} label>
                    {(data?.user_distribution || []).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="healthcare-card p-6 space-y-3">
            <h2 className="font-display font-bold text-[#0B2D52]">Comparison Agreement Statistics</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.comparison_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0D9488" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
