import React, { useEffect, useState } from 'react';
import { BarChart3, Info } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';

export const AccuracyAnalysisPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [datasetId, setDatasetId] = useState<string>('');
  const [condition, setCondition] = useState<string>('all');

  const load = async () => {
    const params = new URLSearchParams();
    if (datasetId) params.set('dataset_id', datasetId);
    if (condition) params.set('condition', condition);
    const res = await apiRequest(`/api/research/accuracy?${params.toString()}`);
    setData(res);
  };

  useEffect(() => {
    load();
  }, [datasetId, condition]);

  const m = data?.metrics || {};
  const pieData = [
    { name: 'Matching', value: m.matching_predictions || 0, color: '#10B981' },
    { name: 'Partial Match', value: m.partial_predictions || 0, color: '#F59E0B' },
    { name: 'Non-Matching', value: m.non_matching_predictions || 0, color: '#EF4444' },
  ];

  return (
    <AppLayout title="Accuracy Analysis Dashboard" subtitle="Statistical evaluation of AI predictions against doctor-confirmed diagnoses">
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-[#0B2D52] flex items-start gap-3 text-sm">
          <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
          <div>
            <strong>Validated Sample Benchmark Notice:</strong> {data?.sample_data_notice || 'Metrics computed on clearly labelled sample benchmark datasets.'}
          </div>
        </div>

        {/* Filters */}
        <div className="healthcare-card p-4 flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Dataset</label>
            <select
              value={datasetId || data?.dataset?.id || ''}
              onChange={(e) => setDatasetId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
            >
              {(data?.available_datasets || []).map((ds: any) => (
                <option key={ds.id} value={ds.id}>{ds.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Condition Filter</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option value="all">All Conditions</option>
              {(data?.available_conditions || []).map((c: string) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Evaluated Cases', value: m.total_cases ?? 0 },
            { label: 'Matching Predictions', value: m.matching_predictions ?? 0 },
            { label: 'Partial Predictions', value: m.partial_predictions ?? 0 },
            { label: 'Non-Matching', value: m.non_matching_predictions ?? 0 },
            { label: 'Diagnostic Agreement', value: `${m.agreement_percentage ?? 0}%` },
          ].map((k) => (
            <div key={k.label} className="healthcare-card p-5">
              <div className="text-xs font-medium text-slate-500">{k.label}</div>
              <div className="text-2xl font-display font-extrabold text-[#0B2D52] mt-1">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Statistical Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Accuracy', value: m.accuracy },
            { label: 'Precision', value: m.precision },
            { label: 'Recall', value: m.recall },
            { label: 'F1-Score', value: m.f1_score },
            { label: 'Sensitivity', value: m.sensitivity },
            { label: 'Specificity', value: m.specificity },
          ].map((stat) => (
            <div key={stat.label} className="healthcare-card p-4 text-center border-t-4 border-t-teal-600">
              <div className="text-xs font-bold uppercase text-slate-500">{stat.label}</div>
              <div className="text-xl font-display font-extrabold text-teal-700 mt-1">
                {stat.value !== undefined ? `${(stat.value * 100).toFixed(1)}%` : '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="healthcare-card p-6 space-y-3">
            <h3 className="font-display font-bold text-[#0B2D52]">Outcome Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={4}>
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="healthcare-card p-6 space-y-3">
            <h3 className="font-display font-bold text-[#0B2D52] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" /> Performance Trend Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={m.monthly_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="accuracy_pct" name="Agreement %" stroke="#0D9488" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="healthcare-card p-6 space-y-3">
            <h3 className="font-display font-bold text-[#0B2D52]">Condition-Wise Agreement (%)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(m.condition_breakdown || []).slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="condition" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={55} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="agreement_rate" name="Agreement %" fill="#0B2D52" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
