import React, { useEffect, useState } from 'react';
import { Grid3X3, Info } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';

export const ConfusionMatrixPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [datasetId, setDatasetId] = useState('');
  const [condition, setCondition] = useState('all');
  const [modelVersion, setModelVersion] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (datasetId) params.set('dataset_id', datasetId);
    if (condition) params.set('condition', condition);
    if (modelVersion) params.set('model_version', modelVersion);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    apiRequest(`/api/research/accuracy?${params.toString()}`).then(setData);
  }, [datasetId, condition, modelVersion, dateFrom, dateTo]);

  const cm = data?.metrics?.confusion_matrix || { tp: 0, tn: 0, fp: 0, fn: 0 };
  const total = cm.tp + cm.tn + cm.fp + cm.fn;

  return (
    <AppLayout title="Interactive Confusion Matrix" subtitle="Inspect True Positives, True Negatives, False Positives, and False Negatives across filters">
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sm text-[#0B2D52] flex items-center gap-2.5">
          <Info className="w-5 h-5 text-sky-700 shrink-0" />
          <span>{data?.sample_data_notice || 'Computed dynamically from labelled sample benchmark datasets.'}</span>
        </div>

        {/* Multi-Filter Controls */}
        <div className="healthcare-card p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Dataset</label>
            <select value={datasetId || data?.dataset?.id || ''} onChange={(e) => setDatasetId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white">
              {(data?.available_datasets || []).map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Medical Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white">
              <option value="all">All Conditions</option>
              {(data?.available_conditions || []).map((c: string) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">AI Model Version</label>
            <select value={modelVersion} onChange={(e) => setModelVersion(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white">
              <option value="all">All Versions</option>
              <option value="clinical-nlp-sklearn-v2.1">clinical-nlp-sklearn-v2.1</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Date To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* 2x2 Interactive Matrix */}
          <div className="healthcare-card p-6 space-y-4">
            <h2 className="font-display font-bold text-lg text-[#0B2D52] flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-teal-600" /> 2×2 Clinical Classification Matrix (N = {total})
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center items-center">
              <div />
              <div className="text-xs font-bold uppercase text-slate-500">AI Predicted Positive</div>
              <div className="text-xs font-bold uppercase text-slate-500">AI Predicted Negative</div>

              <div className="text-xs font-bold uppercase text-slate-500 text-right pr-2">Doctor Confirmed Positive</div>
              <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-400">
                <div className="text-xs font-bold text-emerald-800 uppercase">True Positive (TP)</div>
                <div className="text-3xl font-display font-extrabold text-emerald-900 mt-1">{cm.tp}</div>
              </div>
              <div className="p-6 rounded-2xl bg-rose-50 border-2 border-rose-300">
                <div className="text-xs font-bold text-rose-800 uppercase">False Negative (FN)</div>
                <div className="text-3xl font-display font-extrabold text-rose-900 mt-1">{cm.fn}</div>
              </div>

              <div className="text-xs font-bold uppercase text-slate-500 text-right pr-2">Doctor Confirmed Negative</div>
              <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-300">
                <div className="text-xs font-bold text-amber-800 uppercase">False Positive (FP)</div>
                <div className="text-3xl font-display font-extrabold text-amber-900 mt-1">{cm.fp}</div>
              </div>
              <div className="p-6 rounded-2xl bg-sky-50 border-2 border-sky-300">
                <div className="text-xs font-bold text-sky-800 uppercase">True Negative (TN)</div>
                <div className="text-3xl font-display font-extrabold text-sky-900 mt-1">{cm.tn}</div>
              </div>
            </div>
          </div>

          {/* Derived Statistics */}
          <div className="healthcare-card p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-[#0B2D52]">Derived Diagnostic Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Sensitivity (TPR)', val: data?.metrics?.sensitivity },
                { name: 'Specificity (TNR)', val: data?.metrics?.specificity },
                { name: 'Precision (PPV)', val: data?.metrics?.precision },
                { name: 'F1-Score', val: data?.metrics?.f1_score },
              ].map((s) => (
                <div key={s.name} className="p-4 rounded-xl bg-[#F4F8FC] border border-sky-100">
                  <div className="text-xs text-slate-500 font-medium">{s.name}</div>
                  <div className="text-2xl font-display font-bold text-[#0B2D52] mt-1">
                    {s.val !== undefined ? `${(s.val * 100).toFixed(1)}%` : '—'}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In clinical screening, minimizing <strong>False Negatives (FN)</strong> is critical so serious conditions are not missed by decision-support tools.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
