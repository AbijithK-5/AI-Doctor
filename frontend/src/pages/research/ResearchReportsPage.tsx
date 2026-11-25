import React, { useEffect, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest, downloadProtectedFile } from '../../lib/api';

export const ResearchReportsPage: React.FC = () => {
  const [accuracy, setAccuracy] = useState<any>(null);
  const [disagreements, setDisagreements] = useState<any>(null);
  const [xai, setXai] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      apiRequest('/api/research/accuracy'),
      apiRequest('/api/research/disagreements'),
      apiRequest('/api/research/explainable-ai'),
    ]).then(([acc, dis, x]) => {
      setAccuracy(acc);
      setDisagreements(dis);
      setXai(x);
    });
  }, []);

  const m = accuracy?.metrics || {};
  const cm = m.confusion_matrix || { tp: 0, tn: 0, fp: 0, fn: 0 };

  const handleExportJson = () => {
    const payload = {
      generated_at: new Date().toISOString(),
      sample_data_notice: accuracy?.sample_data_notice,
      metrics: m,
      disagreement_summary: disagreements?.summary,
      model_info: xai?.model_info,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai_vs_human_research_report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout title="Research Reports" subtitle="Consolidated diagnostic agreement, precision/recall, confusion matrix, disagreement, and XAI report">
      <div className="space-y-6">
        <div className="healthcare-card p-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <span className="text-xs font-semibold text-slate-600">
            Dataset: <strong>{accuracy?.dataset?.name || 'Sample Benchmark'}</strong> (Clearly labelled sample data)
          </span>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> Print Report
            </button>
            <button onClick={handleExportJson} className="px-3.5 py-2 rounded-xl bg-[#0B2D52] text-white text-xs font-semibold flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export JSON Report
            </button>
            {accuracy?.dataset?.id && (
              <button
                onClick={() => downloadProtectedFile(`/api/research/datasets/${accuracy.dataset.id}/export`, 'research_dataset.csv')}
                className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Export Dataset CSV
              </button>
            )}
          </div>
        </div>

        <div className="healthcare-card p-6 sm:p-8 space-y-6 bg-white">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="font-display text-2xl font-bold text-[#0B2D52]">AI vs Human Doctor – Diagnostic Concordance Research Report</h2>
            <p className="text-xs text-slate-500 mt-1">{accuracy?.sample_data_notice}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#F4F8FC]">
              <div className="text-xs text-slate-500">Agreement %</div>
              <div className="text-xl font-bold text-[#0B2D52]">{m.agreement_percentage ?? 0}%</div>
            </div>
            <div className="p-4 rounded-xl bg-[#F4F8FC]">
              <div className="text-xs text-slate-500">Precision / Recall</div>
              <div className="text-xl font-bold text-teal-700">
                {m.precision !== undefined ? `${(m.precision * 100).toFixed(1)}% / ${(m.recall * 100).toFixed(1)}%` : '—'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#F4F8FC]">
              <div className="text-xs text-slate-500">F1-Score</div>
              <div className="text-xl font-bold text-[#0B2D52]">{m.f1_score !== undefined ? `${(m.f1_score * 100).toFixed(1)}%` : '—'}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#F4F8FC]">
              <div className="text-xs text-slate-500">Confusion Matrix (TP/TN/FP/FN)</div>
              <div className="text-sm font-bold text-[#0B2D52] mt-1">{cm.tp} / {cm.tn} / {cm.fp} / {cm.fn}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-display font-bold text-sm text-[#0B2D52]">Doctor–AI Disagreement Summary</h3>
              <p className="text-xs text-slate-600">
                Reviewed Live Comparisons: <strong>{disagreements?.summary?.total_reviewed ?? 0}</strong> | Agree: <strong>{disagreements?.summary?.agree_cases ?? 0}</strong> | Partial: <strong>{disagreements?.summary?.partial_cases ?? 0}</strong> | Disagree: <strong>{disagreements?.summary?.disagree_cases ?? 0}</strong>
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-display font-bold text-sm text-[#0B2D52]">Explainable AI Top Predictors</h3>
              <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                {(xai?.global_feature_importance || []).slice(0, 4).map((f: any) => (
                  <li key={f.feature}>{f.feature} (Weight: {f.mean_weight})</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
