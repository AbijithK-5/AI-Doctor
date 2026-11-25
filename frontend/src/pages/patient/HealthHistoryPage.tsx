import React, { useEffect, useState } from 'react';
import { Filter, History, Pill, Stethoscope } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';

export const HealthHistoryPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [category, setCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = async () => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    const res = await apiRequest(`/api/patient/history?${params.toString()}`);
    setData(res);
  };

  useEffect(() => {
    load();
  }, [category, dateFrom, dateTo]);

  return (
    <AppLayout title="Health History" subtitle="Chronological timeline of symptoms, AI assessments, doctor diagnoses, prescriptions, and comparisons">
      <div className="space-y-6">
        <div className="healthcare-card p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-[#0B2D52]">
            <Filter className="w-4 h-4 text-teal-600" /> Filters:
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white">
            <option value="all">All Categories</option>
            <option value="symptoms">Symptoms</option>
            <option value="ai_assessments">AI Assessments</option>
            <option value="diagnoses">Doctor Diagnoses</option>
            <option value="reports">Medical Reports</option>
            <option value="comparisons">Comparisons</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm" />
          <span className="text-xs text-slate-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 healthcare-card p-6 space-y-4">
            <h2 className="font-display font-bold text-lg text-[#0B2D52] flex items-center gap-2">
              <History className="w-5 h-5 text-teal-600" /> Longitudinal Medical Timeline
            </h2>
            {(data?.timeline || []).length === 0 ? (
              <p className="text-sm text-slate-500">No health history items match the selected filters.</p>
            ) : (
              <div className="space-y-3">
                {data.timeline.map((item: any) => (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-[#F9FBFE] space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-[#0B2D52]">{item.title}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                        {item.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{item.summary}</p>
                    <div className="text-[11px] text-slate-400">{new Date(item.date).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="healthcare-card p-6 space-y-3">
              <h3 className="font-display font-bold text-[#0B2D52] flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600" /> Doctor-Confirmed Diagnoses
              </h3>
              {(data?.diagnoses || []).map((d: any) => (
                <div key={d.id} className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                  <div className="font-bold text-emerald-900">{d.confirmed_diagnosis}</div>
                  <div className="text-emerald-800">{d.doctor_name} • {new Date(d.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>

            <div className="healthcare-card p-6 space-y-3">
              <h3 className="font-display font-bold text-[#0B2D52] flex items-center gap-2">
                <Pill className="w-5 h-5 text-sky-600" /> Recorded Prescriptions
              </h3>
              {(data?.prescriptions || []).length === 0 ? (
                <p className="text-xs text-slate-500">No prescriptions recorded.</p>
              ) : (
                data.prescriptions.map((p: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs space-y-1">
                    <div className="font-bold text-[#0B2D52]">{p.prescription}</div>
                    <div className="text-slate-600">For: {p.diagnosis} ({p.doctor_name})</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
