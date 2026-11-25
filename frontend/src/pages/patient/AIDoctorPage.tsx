import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Bot, HelpCircle, Send, ShieldAlert, Sparkles, Stethoscope } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';
import { AIAssessment } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AIDoctorPage: React.FC = () => {
  const { showToast } = useToast();
  const [assessments, setAssessments] = useState<AIAssessment[]>([]);
  const [selected, setSelected] = useState<AIAssessment | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [quickSymptom, setQuickSymptom] = useState('');
  const [generating, setGenerating] = useState(false);

  const loadAssessments = async () => {
    const list = await apiRequest<AIAssessment[]>('/api/patient/ai-assessments');
    setAssessments(list);
    if (list.length > 0 && !selected) {
      setSelected(list[0]);
    } else if (selected) {
      const updated = list.find((a) => a.id === selected.id);
      if (updated) setSelected(updated);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const handleQuickAssess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSymptom.trim()) return;
    setGenerating(true);
    try {
      const created = await apiRequest<AIAssessment>('/api/patient/ai-assessments', {
        method: 'POST',
        body: JSON.stringify({ main_symptom: quickSymptom, duration: '2 days', severity: 'moderate' }),
      });
      showToast('AI educational decision-support report generated & saved.', 'success');
      setQuickSymptom('');
      setAssessments((prev) => [created, ...prev]);
      setSelected(created);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !chatInput.trim()) return;
    setSendingChat(true);
    try {
      const res = await apiRequest('/api/patient/ai-assessments/chat', {
        method: 'POST',
        body: JSON.stringify({ assessment_id: selected.id, message: chatInput }),
      });
      setSelected({ ...selected, chat_history: res.chat_history });
      setChatInput('');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <AppLayout title="AI Doctor" subtitle="Educational clinical decision-support assistant & interactive symptom follow-up">
      <div className="space-y-6">
        {/* Mandatory Clinical Safety Disclaimer */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <strong>Educational Decision-Support Only (Demo ML Mode):</strong> AI results are NOT medical diagnoses, prescriptions, or treatment instructions. Always consult a registered human physician.
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left: Assessment History & Quick Prompt */}
          <div className="lg:col-span-4 space-y-4">
            <form onSubmit={handleQuickAssess} className="healthcare-card p-4 space-y-2.5">
              <label className="text-xs font-bold uppercase text-[#0B2D52]">Quick AI Symptom Assessment</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickSymptom}
                  onChange={(e) => setQuickSymptom(e.target.value)}
                  placeholder="e.g., Headache and light sensitivity"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <button
                  type="submit"
                  disabled={generating}
                  className="px-3.5 py-2 rounded-xl bg-[#0B2D52] text-white text-xs font-semibold hover:bg-[#123E6F]"
                >
                  {generating ? '...' : 'Run'}
                </button>
              </div>
              <Link to="/patient/symptoms" className="block text-[11px] text-teal-700 font-semibold hover:underline">
                Need multi-symptom intake? Open Full Symptom Checker →
              </Link>
            </form>

            <div className="healthcare-card p-4 space-y-3">
              <h3 className="font-display font-bold text-sm text-[#0B2D52]">Assessment History ({assessments.length})</h3>
              <div className="space-y-2 max-h-[480px] overflow-y-auto">
                {assessments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selected?.id === a.id
                        ? 'bg-sky-50 border-teal-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#0B2D52] truncate">
                        {a.possible_conditions?.[0]?.condition_name || `Assessment #${a.id}`}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        a.risk_classification === 'urgent' || a.risk_classification === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : a.risk_classification === 'moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {a.risk_classification}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{new Date(a.created_at).toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Detailed AI Report + Interactive Chatbot */}
          <div className="lg:col-span-8 space-y-6">
            {!selected ? (
              <div className="healthcare-card p-10 text-center text-slate-500">
                Select an AI assessment or run a new symptom check to inspect the decision-support report.
              </div>
            ) : (
              <>
                <div className="healthcare-card p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-teal-700 flex items-center justify-center">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="font-display font-bold text-lg text-[#0B2D52]">AI Decision-Support Report #{selected.id}</h2>
                        <div className="text-xs text-slate-500">
                          {selected.model_name} ({selected.model_version}) • {selected.is_demo_mode ? 'Demo ML Mode' : 'Connected LLM'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        selected.risk_classification === 'urgent' || selected.risk_classification === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : selected.risk_classification === 'moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Risk: {selected.risk_classification}
                      </span>
                      <Link
                        to="/patient/consultations"
                        className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 flex items-center gap-1.5"
                      >
                        <Stethoscope className="w-3.5 h-3.5" /> Request Doctor Review
                      </Link>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 bg-[#F4F8FC] p-4 rounded-xl border border-sky-100 leading-relaxed">
                    {selected.primary_summary}
                  </p>

                  {/* Possible Conditions */}
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#0B2D52] mb-2.5">Possible Health Conditions (Informational Ranking)</h3>
                    <div className="space-y-2.5">
                      {selected.possible_conditions.map((c) => (
                        <div key={c.condition_name} className="p-3.5 rounded-xl border border-slate-200 bg-white">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-bold text-sm text-[#0B2D52]">
                              #{c.rank_order} {c.condition_name} <span className="text-xs font-normal text-slate-400">({c.icd_code})</span>
                            </div>
                            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full">
                              Relative Match: {c.relative_likelihood_score}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{c.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                      <h4 className="font-bold text-xs uppercase text-emerald-900 mb-2">Supporting Symptoms</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.supporting_symptoms.map((s) => (
                          <span key={s} className="px-2.5 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200 text-xs">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                      <h4 className="font-bold text-xs uppercase text-amber-900 mb-2 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Missing Information for Doctor
                      </h4>
                      <ul className="text-xs text-amber-900 space-y-1 list-disc list-inside">
                        {selected.missing_information.map((m) => <li key={m}>{m}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200">
                      <h4 className="font-bold text-xs uppercase text-[#0B2D52] mb-2">Suggested Investigations for Doctor Review</h4>
                      <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                        {selected.suggested_investigations.map((i) => <li key={i}>{i}</li>)}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <h4 className="font-bold text-xs uppercase text-[#0B2D52] mb-2 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-teal-600" /> Follow-Up Questions
                      </h4>
                      <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                        {selected.follow_up_questions.map((q) => <li key={q}>{q}</li>)}
                      </ul>
                    </div>
                  </div>

                  {selected.general_health_education && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <strong className="text-[#0B2D52]">General Health Education:</strong> {selected.general_health_education}
                    </div>
                  )}
                </div>

                {/* Interactive Follow-up Chatbot */}
                <div className="healthcare-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-base text-[#0B2D52] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" /> AI Follow-Up Assistant
                    </h3>
                    <span className="text-[11px] text-slate-500">Ask about tests, explainability, or next steps</span>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto p-3 rounded-xl bg-[#F4F8FC] border border-sky-100">
                    {(selected.chat_history || []).map((msg, i) => (
                      <div key={i} className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            msg.sender === 'patient'
                              ? 'bg-[#0B2D52] text-white'
                              : 'bg-white border border-slate-200 text-slate-800'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleChatSend} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask a follow-up question (e.g., Why did you rank this condition?)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={sendingChat}
                      className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" /> Send
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
