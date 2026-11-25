import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FileBarChart,
  GitCompare,
  Info,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';
import { ComparisonRecord } from '../../types';

export const ComparisonDashboardPage: React.FC = () => {
  const [comparisons, setComparisons] = useState<ComparisonRecord[]>([]);
  const [selected, setSelected] = useState<ComparisonRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<ComparisonRecord[]>('/api/comparisons')
      .then((res) => {
        setComparisons(res);
        if (res.length > 0) setSelected(res[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout title="AI vs Human Comparison Dashboard" subtitle="Loading side-by-side comparison analytics...">
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const chartData = selected
    ? [
        { metric: 'Matching Cond.', count: selected.matching_conditions.length, color: '#10B981' },
        { metric: 'Shared Symp.', count: selected.shared_symptoms.length, color: '#10B981' },
        { metric: 'Similar Tests', count: selected.similar_investigations.length, color: '#0EA5E9' },
        { metric: 'Diff. Cond.', count: selected.different_conditions.length, color: '#EF4444' },
        { metric: 'Diff. Tests', count: selected.different_investigations.length, color: '#F59E0B' },
      ]
    : [];

  return (
    <AppLayout
      title="AI vs Human Comparison Dashboard"
      subtitle="Side-by-side comparison of AI decision support and authoritative physician clinical assessments"
    >
      <div className="space-y-6">
        {/* Mandatory Authoritative Statement */}
        <div className="p-4 rounded-2xl bg-sky-50 border-2 border-sky-300 text-[#0B2D52] flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>Authoritative Clinical Policy:</strong>{' '}
            &ldquo;The human doctor&apos;s clinical assessment remains authoritative. AI-generated information is provided only for decision support.&rdquo;
            Agreement does not automatically prove either assessment correct without clinical verification.
          </div>
        </div>

        {/* Comparison Selector */}
        <div className="healthcare-card p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500 mr-1">Select Case:</span>
            {comparisons.map((cmp) => (
              <button
                key={cmp.id}
                onClick={() => setSelected(cmp)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                  selected?.id === cmp.id
                    ? 'bg-[#0B2D52] text-white border-[#0B2D52]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>#{cmp.id} — {cmp.doctor_assessment?.confirmed_diagnosis || 'Comparison'}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  cmp.agreement_status === 'agree'
                    ? 'bg-emerald-500 text-white'
                    : cmp.agreement_status === 'partial_agree'
                    ? 'bg-amber-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}>
                  {cmp.agreement_score}%
                </span>
              </button>
            ))}
          </div>
          {selected && (
            <Link
              to={`/comparison/report/${selected.id}`}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 flex items-center gap-1.5"
            >
              <FileBarChart className="w-4 h-4" /> Detailed Report &amp; PDF
            </Link>
          )}
        </div>

        {!selected ? (
          <div className="healthcare-card p-10 text-center text-slate-500">
            No completed comparisons available yet. Complete an AI assessment and a Human Doctor consultation to generate a comparison.
          </div>
        ) : (
          <>
            {/* Status Banner */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className={`healthcare-card p-5 border-l-4 ${
                selected.agreement_status === 'agree'
                  ? 'border-l-emerald-500 bg-emerald-50/40'
                  : selected.agreement_status === 'partial_agree'
                  ? 'border-l-amber-500 bg-amber-50/40'
                  : 'border-l-rose-500 bg-rose-50/40'
              }`}>
                <div className="text-xs font-bold uppercase text-slate-500">Agreement Status</div>
                <div className="text-xl font-display font-extrabold text-[#0B2D52] mt-1 capitalize">
                  {selected.agreement_status.replace('_', ' ')}
                </div>
                <div className="text-xs text-slate-600 mt-1">Alignment Score: {selected.agreement_score}%</div>
              </div>
              <div className="healthcare-card p-5 border-l-4 border-l-sky-500">
                <div className="text-xs font-bold uppercase text-slate-500">Patient &amp; Clinician</div>
                <div className="font-bold text-sm text-[#0B2D52] mt-1">{selected.patient_name}</div>
                <div className="text-xs text-teal-700 mt-0.5">{selected.doctor_name} ({selected.doctor_speciality})</div>
              </div>
              <div className="healthcare-card p-5 border-l-4 border-l-emerald-500">
                <div className="text-xs font-bold uppercase text-slate-500">Risk Stratification</div>
                <div className="text-xs mt-1.5 space-y-1">
                  <div>AI Risk: <strong className="uppercase">{selected.risk_comparison?.ai_risk}</strong></div>
                  <div>Doctor Risk: <strong className="uppercase text-emerald-700">{selected.risk_comparison?.doctor_risk}</strong></div>
                </div>
              </div>
              <div className="healthcare-card p-5 border-l-4 border-l-teal-500">
                <div className="text-xs font-bold uppercase text-slate-500">Compared Date</div>
                <div className="font-bold text-sm text-[#0B2D52] mt-1">{new Date(selected.compared_at).toLocaleDateString()}</div>
                <div className="text-xs text-slate-500 mt-0.5">{new Date(selected.compared_at).toLocaleTimeString()}</div>
              </div>
            </div>

            {/* Side-by-Side Major Panels */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* LEFT PANEL – AI DOCTOR */}
              <div className="healthcare-card p-6 border-t-4 border-t-sky-600 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-lg text-[#0B2D52]">LEFT PANEL – AI DOCTOR</h2>
                      <div className="text-xs text-sky-700 font-medium">Educational Decision Support Only</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-sky-100 text-sky-800">
                    Risk: {selected.ai_assessment.risk_classification}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 text-xs text-slate-700 leading-relaxed">
                  <strong className="text-[#0B2D52]">AI Summary:</strong> {selected.ai_assessment.primary_summary}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Possible Conditions Ranked</h4>
                  <div className="space-y-2">
                    {(selected.ai_assessment.possible_conditions || []).map((c) => (
                      <div key={c.condition_name} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#0B2D52]">#{c.rank_order} {c.condition_name}</span>
                        <span className="text-sky-700 font-bold">{c.relative_likelihood_score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-1.5">Symptoms Identified</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(selected.ai_assessment.supporting_symptoms || []).map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs">{s}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-1.5">Suggested Investigations</h4>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                    {(selected.ai_assessment.suggested_investigations || []).map((inv) => <li key={inv}>{inv}</li>)}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-1.5">AI Recommendations</h4>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    {(selected.ai_assessment.ai_recommendations || []).map((rec) => <li key={rec}>{rec}</li>)}
                  </ul>
                </div>
              </div>

              {/* RIGHT PANEL – HUMAN DOCTOR */}
              <div className="healthcare-card p-6 border-t-4 border-t-emerald-600 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-lg text-[#0B2D52]">RIGHT PANEL – HUMAN DOCTOR</h2>
                      <div className="text-xs text-emerald-700 font-semibold">Authoritative Clinical Assessment • {selected.doctor_name}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                    Risk: {selected.doctor_assessment.risk_classification}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] font-bold uppercase text-emerald-800">Doctor-Confirmed Diagnosis</div>
                  <div className="text-base font-display font-bold text-emerald-950 mt-0.5">
                    {selected.doctor_assessment.confirmed_diagnosis}
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div><strong className="text-[#0B2D52]">Clinical Assessment:</strong> {selected.doctor_assessment.clinical_assessment}</div>
                  <div><strong className="text-[#0B2D52]">Observations:</strong> {selected.doctor_assessment.clinical_observations}</div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-1.5">Symptoms Identified</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(selected.doctor_assessment.symptoms_identified || []).map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">{s}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-1.5">Recommended Investigations</h4>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                    {(selected.doctor_assessment.recommended_investigations || []).map((inv) => <li key={inv}>{inv}</li>)}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs space-y-1">
                  <div><strong className="text-[#0B2D52]">Clinical Treatment Plan:</strong> {selected.doctor_assessment.treatment_plan || 'N/A'}</div>
                  {selected.doctor_assessment.prescription && (
                    <div><strong className="text-[#0B2D52]">Prescription:</strong> {selected.doctor_assessment.prescription}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Color-Coded Comparison Results & Visual Chart */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 healthcare-card p-6 space-y-4">
                <h3 className="font-display font-bold text-lg text-[#0B2D52]">Structured Agreement &amp; Disagreement Analysis</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Areas of Agreement (Green)
                    </div>
                    <ul className="text-xs text-emerald-900 space-y-1 list-disc list-inside">
                      {selected.areas_of_agreement.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                    {selected.matching_conditions.length > 0 && (
                      <div className="text-xs pt-1"><strong>Matching Conditions:</strong> {selected.matching_conditions.join(', ')}</div>
                    )}
                    {selected.shared_symptoms.length > 0 && (
                      <div className="text-xs"><strong>Shared Symptoms:</strong> {selected.shared_symptoms.join(', ')}</div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase text-rose-900">
                      <XCircle className="w-4 h-4 text-rose-600" /> Areas of Disagreement (Red)
                    </div>
                    {selected.areas_of_disagreement.length === 0 ? (
                      <p className="text-xs text-rose-800">No major disagreements noted.</p>
                    ) : (
                      <ul className="text-xs text-rose-900 space-y-1 list-disc list-inside">
                        {selected.areas_of_disagreement.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    )}
                    {selected.different_conditions.length > 0 && (
                      <div className="text-xs pt-1"><strong>Different Conditions:</strong> {selected.different_conditions.join(' | ')}</div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Missing / Divergent Details (Orange)
                    </div>
                    <div className="text-xs text-amber-900">
                      <strong>Missing Symptoms:</strong> {selected.missing_symptoms.join('; ') || 'None'}
                    </div>
                    <div className="text-xs text-amber-900">
                      <strong>Different Investigations:</strong> {selected.different_investigations.join('; ') || 'None'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase text-sky-900">
                      <Info className="w-4 h-4 text-sky-600" /> Informational Alignment (Blue)
                    </div>
                    <div className="text-xs text-sky-900">
                      <strong>Similar Investigations:</strong> {selected.similar_investigations.join(', ') || 'None'}
                    </div>
                    <div className="text-xs text-sky-900">
                      <strong>Treatment Comparison:</strong> {selected.treatment_comparison}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Comparison Chart */}
              <div className="healthcare-card p-6 space-y-4">
                <h3 className="font-display font-bold text-base text-[#0B2D52]">Visual Comparison Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis dataKey="metric" type="category" width={92} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {chartData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};
