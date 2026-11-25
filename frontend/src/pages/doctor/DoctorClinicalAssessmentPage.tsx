import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Eye, EyeOff, Send } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export const DoctorClinicalAssessmentPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [blindMode, setBlindMode] = useState(true); // Doctor enters independent assessment before optionally viewing AI

  const [observations, setObservations] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [clinicalAssessment, setClinicalAssessment] = useState('');
  const [confirmedDiagnosis, setConfirmedDiagnosis] = useState('');
  const [differentials, setDifferentials] = useState('');
  const [investigations, setInvestigations] = useState('');
  const [risk, setRisk] = useState<'low' | 'moderate' | 'high' | 'urgent'>('moderate');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const list = await apiRequest('/api/doctor/consultations');
    setConsultations(list);
    const pending = list.find((c: any) => c.status !== 'completed') || list[0];
    if (pending && !selectedId) {
      selectConsult(pending);
    }
  };

  const selectConsult = (c: any) => {
    setSelectedId(c.id);
    const symList = c.symptom_record
      ? [c.symptom_record.main_symptom, ...(c.symptom_record.additional_symptoms || [])]
      : [];
    setSymptoms(symList.join(', '));
  };

  useEffect(() => {
    load();
  }, []);

  const selected = consultations.find((c) => c.id === selectedId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await apiRequest('/api/doctor/assessments', {
        method: 'POST',
        body: JSON.stringify({
          consultation_id: selected.id,
          clinical_observations: observations,
          symptoms_identified: symptoms.split(',').map((s) => s.trim()).filter(Boolean),
          clinical_assessment: clinicalAssessment,
          confirmed_diagnosis: confirmedDiagnosis,
          differential_diagnoses: differentials.split(',').map((s) => s.trim()).filter(Boolean),
          recommended_investigations: investigations.split(',').map((s) => s.trim()).filter(Boolean),
          risk_classification: risk,
          treatment_plan: treatmentPlan || null,
          prescription: prescription || null,
          additional_notes: notes || null,
        }),
      });
      showToast('Independent clinical assessment saved & Comparison Engine updated!', 'success');
      if (res.comparison_id) {
        navigate(`/comparison/report/${res.comparison_id}`);
      } else {
        await load();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Doctor Clinical Assessment" subtitle="Record an independent, authoritative clinical diagnosis without bias from AI suggestions">
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="healthcare-card p-5 space-y-3">
            <h2 className="font-display font-bold text-[#0B2D52]">Consultation Queue</h2>
            <div className="space-y-2.5">
              {consultations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConsult(c)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedId === c.id ? 'bg-sky-50 border-teal-500' : 'bg-white border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0B2D52]">{c.patient_name}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      c.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Symptom: {c.symptom_record?.main_symptom || 'General consult'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selected?.ai_assessment && (
            <div className="healthcare-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm text-[#0B2D52]">Independent Blind Mode</h3>
                <button
                  type="button"
                  onClick={() => setBlindMode((v) => !v)}
                  className="text-xs font-semibold text-teal-700 flex items-center gap-1"
                >
                  {blindMode ? <><Eye className="w-3.5 h-3.5" /> Reveal AI</> : <><EyeOff className="w-3.5 h-3.5" /> Hide AI</>}
                </button>
              </div>
              {blindMode ? (
                <p className="text-xs text-slate-500">
                  AI suggestions are hidden so your clinical assessment remains completely independent. Toggle Reveal AI anytime or review after submission.
                </p>
              ) : (
                <div className="text-xs space-y-1.5 bg-sky-50 p-3 rounded-xl border border-sky-200">
                  <div className="font-bold text-[#0B2D52]">AI Top: {selected.ai_assessment.possible_conditions?.[0]?.condition_name}</div>
                  <div>Risk: <strong className="uppercase">{selected.ai_assessment.risk_classification}</strong></div>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="lg:col-span-8 healthcare-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-display font-bold text-lg text-[#0B2D52] flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-teal-600" />
              {selected ? `Clinical Assessment for ${selected.patient_name} (#${selected.id})` : 'Select a Consultation'}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Doctor-Confirmed Diagnosis *</label>
              <input type="text" required value={confirmedDiagnosis} onChange={(e) => setConfirmedDiagnosis(e.target.value)} placeholder="e.g., Migraine / Vascular Headache" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Risk Classification *</label>
              <select value={risk} onChange={(e) => setRisk(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Observations (Exam, Vitals) *</label>
            <textarea rows={2} required value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Physical exam findings, vital signs, auscultation..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Symptoms Identified (comma-separated)</label>
            <input type="text" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Assessment *</label>
            <textarea rows={3} required value={clinicalAssessment} onChange={(e) => setClinicalAssessment(e.target.value)} placeholder="Detailed diagnostic reasoning..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Differential Diagnoses (comma-separated)</label>
              <input type="text" value={differentials} onChange={(e) => setDifferentials(e.target.value)} placeholder="Alternative considerations" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Recommended Investigations (comma-separated)</label>
              <input type="text" value={investigations} onChange={(e) => setInvestigations(e.target.value)} placeholder="e.g., CBC, Chest X-Ray, ECG" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Treatment Plan</label>
              <input type="text" value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} placeholder="Therapeutic and follow-up plan" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prescription (if clinically appropriate)</label>
              <input type="text" value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder="Medication, dose, duration" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Additional Clinical Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>

          <button
            type="submit"
            disabled={!selected || submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0B2D52] to-[#0D9488] text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> {submitting ? 'Submitting & Comparing...' : 'Submit Authoritative Clinical Assessment'}
          </button>
        </form>
      </div>
    </AppLayout>
  );
};
