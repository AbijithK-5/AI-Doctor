import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bot, Check, Search, Send } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export const SymptomCheckerPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [mainSymptom, setMainSymptom] = useState('');
  const [additionalSymptoms, setAdditionalSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState('3 days');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe' | 'critical'>('moderate');
  const [frequency, setFrequency] = useState('persistent');
  const [bodyLocation, setBodyLocation] = useState('');
  const [onsetDate, setOnsetDate] = useState('');
  const [relevantHistory, setRelevantHistory] = useState('');
  const [medications, setMedications] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const [cat, hist] = await Promise.all([
      apiRequest('/api/patient/symptoms/catalog'),
      apiRequest('/api/patient/symptoms'),
    ]);
    setCatalog(cat);
    setHistory(hist);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCatalog = catalog.filter((s) =>
    `${s.name} ${s.category}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAdditional = (name: string) => {
    if (name === mainSymptom) return;
    setAdditionalSymptoms((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const hasRedFlag =
    severity === 'critical' ||
    catalog.some(
      (c) => c.is_red_flag && (c.name.toLowerCase() === mainSymptom.toLowerCase() || additionalSymptoms.includes(c.name))
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainSymptom.trim()) {
      showToast('Please select or enter a main symptom.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest('/api/patient/symptoms', {
        method: 'POST',
        body: JSON.stringify({
          main_symptom: mainSymptom,
          additional_symptoms: additionalSymptoms,
          duration,
          severity,
          frequency,
          body_location: bodyLocation || null,
          onset_date: onsetDate || null,
          relevant_medical_history: relevantHistory || null,
          existing_medications: medications.split(',').map((x) => x.trim()).filter(Boolean),
          additional_notes: notes || null,
          run_ai_assessment: true,
        }),
      });
      showToast('Symptoms recorded & AI Decision-Support Assessment generated!', 'success');
      await loadData();
      if (res.ai_assessment?.id) {
        navigate('/patient/ai-doctor');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Symptom Checker" subtitle="Structured symptom intake with red-flag safety screening and AI decision support">
      <div className="space-y-6">
        {hasRedFlag && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-bold">EMERGENCY WARNING: Potentially Serious Symptom Selected</div>
              <p className="mt-0.5">
                Symptoms such as chest pain, shortness of breath, sudden weakness, or critical severity may indicate a medical emergency.
                <strong> Please call emergency medical services (911 / 112) or visit the nearest emergency department immediately</strong> rather than relying on an online assessment.
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <form onSubmit={handleSubmit} className="lg:col-span-2 healthcare-card p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-[#0B2D52]">Enter Current Symptoms</h2>

            {/* Searchable Symptom Selector */}
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-slate-700">Search &amp; Select Symptoms</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search symptom catalog (e.g., Cough, Fever, Chest Pain, Headache)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 rounded-xl bg-[#F4F8FC] border border-sky-100">
                {filteredCatalog.map((sym) => {
                  const isMain = mainSymptom === sym.name;
                  const isAdd = additionalSymptoms.includes(sym.name);
                  return (
                    <button
                      key={sym.id}
                      type="button"
                      onClick={() => {
                        if (!mainSymptom) setMainSymptom(sym.name);
                        else if (isMain) setMainSymptom('');
                        else toggleAdditional(sym.name);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                        isMain
                          ? 'bg-[#0B2D52] text-white border-[#0B2D52]'
                          : isAdd
                          ? 'bg-teal-600 text-white border-teal-600'
                          : sym.is_red_flag
                          ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'
                      }`}
                    >
                      {(isMain || isAdd) && <Check className="w-3 h-3" />}
                      {sym.name}
                      {isMain && <span className="text-[10px] opacity-80">(Main)</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Main Symptom *</label>
                <input
                  type="text"
                  required
                  value={mainSymptom}
                  onChange={(e) => setMainSymptom(e.target.value)}
                  placeholder="Primary symptom"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Additional Symptoms</label>
                <input
                  type="text"
                  value={additionalSymptoms.join(', ')}
                  onChange={(e) => setAdditionalSymptoms(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                  placeholder="Comma-separated additional symptoms"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration *</label>
                <input
                  type="text"
                  required
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 3 days, 2 weeks"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Severity *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['mild', 'moderate', 'severe', 'critical'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize border ${
                        severity === sev
                          ? sev === 'critical' || sev === 'severe'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-[#0B2D52] text-white border-[#0B2D52]'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
                  <option value="constant">Constant</option>
                  <option value="intermittent">Intermittent</option>
                  <option value="after meals">After meals</option>
                  <option value="nighttime">Worse at night</option>
                  <option value="exertional">With exertion</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Body Location</label>
                <input type="text" value={bodyLocation} onChange={(e) => setBodyLocation(e.target.value)} placeholder="e.g., Chest, Lower Abdomen" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Onset Date</label>
                <input type="date" value={onsetDate} onChange={(e) => setOnsetDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Existing Medications</label>
                <input type="text" value={medications} onChange={(e) => setMedications(e.target.value)} placeholder="Comma-separated" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Relevant Medical History</label>
              <input type="text" value={relevantHistory} onChange={(e) => setRelevantHistory(e.target.value)} placeholder="Past conditions, surgeries, or family risk factors" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Triggers, relieving factors, temperature readings..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0B2D52] to-[#0D9488] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95"
            >
              <Bot className="w-4 h-4" />
              <Send className="w-4 h-4" />
              {submitting ? 'Analysing Symptoms...' : 'Submit for AI Decision-Support Assessment'}
            </button>
          </form>

          {/* Symptom History Panel */}
          <div className="healthcare-card p-6 space-y-4">
            <h3 className="font-display font-bold text-[#0B2D52]">Symptom History</h3>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No symptom submissions yet.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-[#F4F8FC] border border-sky-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#0B2D52]">{item.main_symptom}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        item.severity === 'severe' || item.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      Duration: {item.duration} • {item.frequency}
                    </div>
                    {item.additional_symptoms?.length > 0 && (
                      <div className="text-xs text-slate-500">
                        + {item.additional_symptoms.join(', ')}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400">{new Date(item.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
