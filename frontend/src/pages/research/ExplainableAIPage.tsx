import React, { useEffect, useState } from 'react';
import { AlertCircle, Cpu, ShieldAlert, Sparkles } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';

export const ExplainableAIPage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiRequest('/api/research/explainable-ai').then(setData);
  }, []);

  const model = data?.model_info || {};
  const selected = data?.selected_assessment;

  return (
    <AppLayout title="Explainable AI (XAI)" subtitle="Feature attribution, model transparency, uncertainty bounds, and clinical evidence boundaries">
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Model Explanations vs. Clinical Evidence:</strong> {data?.epistemic_notice}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="healthcare-card p-6 space-y-3">
            <h2 className="font-display font-bold text-[#0B2D52] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-teal-600" /> AI Model Architecture
            </h2>
            <div className="text-xs space-y-2 text-slate-700">
              <div><strong>Model Name:</strong> {model.model_name}</div>
              <div><strong>Version:</strong> {model.model_version}</div>
              <div><strong>Pipeline:</strong> {model.architecture}</div>
              <div><strong>Core Domains:</strong> {model.training_conditions_count} curated vignettes</div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <strong>Calibration Status:</strong> {model.calibration_status}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 healthcare-card p-6 space-y-4">
            <h3 className="font-display font-bold text-[#0B2D52] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-600" /> Global Symptom Feature Importance (TF-IDF + Logistic Coefficients)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.global_feature_importance || []} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="feature" type="category" width={190} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="mean_weight" name="Feature Weight" fill="#0B2D52" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {selected && (
            <div className="healthcare-card p-6 space-y-4">
              <h3 className="font-display font-bold text-[#0B2D52]">Latest Assessment Feature Attribution (#{selected.id})</h3>
              <div className="space-y-2.5">
                {(selected.explainability_factors || []).map((f: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#F4F8FC] border border-sky-100">
                    <div className="flex items-center justify-between text-xs font-bold text-[#0B2D52]">
                      <span>{f.feature} ({f.category})</span>
                      <span className="text-teal-700">Weight: {f.importance_weight}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full" style={{ width: `${Math.min(100, f.importance_weight * 100)}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{f.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="healthcare-card p-6 space-y-3">
            <h3 className="font-display font-bold text-[#0B2D52] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" /> Model Limitations &amp; Uncertainty
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-700 list-disc list-inside">
              {(data?.limitations || []).map((lim: string, idx: number) => (
                <li key={idx} className="leading-relaxed">{lim}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
