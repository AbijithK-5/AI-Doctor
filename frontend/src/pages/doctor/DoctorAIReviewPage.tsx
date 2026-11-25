import React, { useEffect, useState } from 'react';
import { Bot, Check, Send, X } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export const DoctorAIReviewPage: React.FC = () => {
  const { showToast } = useToast();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [decisions, setDecisions] = useState<Record<string, 'accepted' | 'rejected' | 'modified'>>({});
  const [disagreementNotes, setDisagreementNotes] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiRequest('/api/doctor/consultations').then((list) => {
      const withAi = list.filter((c: any) => c.ai_assessment);
      setConsultations(withAi);
      if (withAi.length > 0) {
        setSelectedId(withAi[0].id);
        setFinalDiagnosis(withAi[0].doctor_assessment?.confirmed_diagnosis || '');
      }
    });
  }, []);

  const selected = consultations.find((c) => c.id === selectedId);
  const ai = selected?.ai_assessment;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !ai) return;
    setSubmitting(true);
    try {
      const reviews = (ai.possible_conditions || []).map((c: any) => ({
        condition: c.condition_name,
        decision: decisions[c.condition_name] || 'reviewed',
      }));
      await apiRequest('/api/doctor/assessments', {
        method: 'POST',
        body: JSON.stringify({
          consultation_id: selected.id,
          clinical_observations: 'Reviewed AI suggestions alongside patient clinical dossier.',
          symptoms_identified: ai.supporting_symptoms || [],
          clinical_assessment: clinicalSummary || 'Physician AI suggestion audit completed.',
          confirmed_diagnosis: finalDiagnosis || ai.possible_conditions?.[0]?.condition_name || 'Clinical Diagnosis',
          recommended_investigations: ai.suggested_investigations || [],
          risk_classification: ai.risk_classification || 'moderate',
          ai_suggestion_reviews: reviews,
          disagreement_notes: disagreementNotes || null,
        }),
      });
      showToast('AI review & final authoritative assessment saved!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Doctor Review of AI Assessment" subtitle="Critically accept or reject AI suggestions, document disagreements, and finalize clinical judgment">
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 healthcare-card p-5 space-y-3 h-fit">
          <h2 className="font-display font-bold text-[#0B2D52]">Cases With AI Assessments</h2>
          {consultations.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedId(c.id);
                setFinalDiagnosis(c.doctor_assessment?.confirmed_diagnosis || '');
              }}
              className={`w-full text-left p-3.5 rounded-xl border ${
                selectedId === c.id ? 'bg-sky-50 border-teal-500' : 'bg-white border-slate-200'
              }`}
            >
              <div className="font-bold text-sm text-[#0B2D52]">{c.patient_name}</div>
              <div className="text-xs text-slate-500">Consultation #{c.id} • {c.status.replace('_', ' ')}</div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8">
          {!ai ? (
            <div className="healthcare-card p-10 text-center text-slate-500">No AI assessment attached to review.</div>
          ) : (
            <form onSubmit={handleSubmitReview} className="healthcare-card p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Bot className="w-6 h-6 text-sky-700" />
                <div>
                  <h3 className="font-display font-bold text-lg text-[#0B2D52]">AI Output Audit for {selected.patient_name}</h3>
                  <p className="text-xs text-slate-500">Accept or reject each AI condition suggestion independently.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 text-xs text-slate-700">
                {ai.primary_summary}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-500">Review AI Suggested Conditions</h4>
                {(ai.possible_conditions || []).map((c: any) => {
                  const dec = decisions[c.condition_name];
                  return (
                    <div key={c.condition_name} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-sm text-[#0B2D52]">{c.condition_name}</div>
                        <div className="text-xs text-slate-500">Relative Score: {c.relative_likelihood_score}%</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDecisions((d) => ({ ...d, [c.condition_name]: 'accepted' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border ${
                            dec === 'accepted' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-200'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisions((d) => ({ ...d, [c.condition_name]: 'rejected' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border ${
                            dec === 'rejected' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-700 border-rose-200'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Final Authoritative Diagnosis *</label>
                <input type="text" required value={finalDiagnosis} onChange={(e) => setFinalDiagnosis(e.target.value)} placeholder="Enter physician confirmed diagnosis" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Explanation &amp; Disagreement Notes</label>
                <textarea rows={3} value={disagreementNotes} onChange={(e) => setDisagreementNotes(e.target.value)} placeholder="Document why AI suggestions were accepted, rejected, or modified..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Final Clinical Assessment Summary</label>
                <textarea rows={2} value={clinicalSummary} onChange={(e) => setClinicalSummary(e.target.value)} placeholder="Concise clinical conclusion" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>

              <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0B2D52] to-[#0D9488] text-white font-semibold text-sm flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> {submitting ? 'Saving Review...' : 'Submit Final Clinical Review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
