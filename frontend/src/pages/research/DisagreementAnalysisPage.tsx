import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';

export const DisagreementAnalysisPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    apiRequest('/api/research/disagreements').then(setData);
  }, []);

  const cases = (data?.cases || []).filter((c: any) => (filter === 'all' ? true : c.agreement_status === filter));
  const summary = data?.summary || {};

  return (
    <AppLayout title="Doctor–AI Disagreement Analysis" subtitle="De-identified study of clinical divergence, risk upgrades, and physician review explanations">
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sm text-[#0B2D52] flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0" />
          <span>All patient identifiers are stripped (`DEID-XXXX`) for ethical research evaluation.</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="healthcare-card p-5">
            <div className="text-xs text-slate-500">Total Reviewed Cases</div>
            <div className="text-2xl font-display font-extrabold text-[#0B2D52] mt-1">{summary.total_reviewed ?? 0}</div>
          </div>
          <div className="healthcare-card p-5 border-l-4 border-l-emerald-500">
            <div className="text-xs text-slate-500">Agree Cases</div>
            <div className="text-2xl font-display font-extrabold text-emerald-700 mt-1">{summary.agree_cases ?? 0}</div>
          </div>
          <div className="healthcare-card p-5 border-l-4 border-l-amber-500">
            <div className="text-xs text-slate-500">Partial Agreement</div>
            <div className="text-2xl font-display font-extrabold text-amber-700 mt-1">{summary.partial_cases ?? 0}</div>
          </div>
          <div className="healthcare-card p-5 border-l-4 border-l-rose-500">
            <div className="text-xs text-slate-500">Disagreement Cases</div>
            <div className="text-2xl font-display font-extrabold text-rose-700 mt-1">{summary.disagree_cases ?? 0}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="healthcare-card p-6 space-y-3">
            <h3 className="font-display font-bold text-[#0B2D52] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Types of Disagreement
            </h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.disagreement_type_breakdown || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0D9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 healthcare-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display font-bold text-[#0B2D52]">De-identified Case Log</h3>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
                <option value="all">All Cases</option>
                <option value="agree">Agree</option>
                <option value="partial_agree">Partial Agree</option>
                <option value="disagree">Disagree</option>
              </select>
            </div>

            <div className="space-y-3">
              {cases.map((c: any) => (
                <div key={c.case_code} className="p-4 rounded-xl border border-slate-200 bg-[#F9FBFE] space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-sm text-[#0B2D52]">{c.case_code} • {c.disagreement_type}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      c.agreement_status === 'agree'
                        ? 'bg-emerald-100 text-emerald-800'
                        : c.agreement_status === 'partial_agree'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {c.agreement_status.replace('_', ' ')} ({c.agreement_score}%)
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    <div><strong>AI Prediction:</strong> {c.ai_top_prediction} (Risk: {c.ai_risk})</div>
                    <div><strong>Doctor Diagnosis:</strong> {c.doctor_confirmed_diagnosis} (Risk: {c.doctor_risk})</div>
                  </div>
                  {c.doctor_explanation && (
                    <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                      <strong>Clinician Rationale:</strong> {c.doctor_explanation}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400">Status: {c.doctor_review_status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
