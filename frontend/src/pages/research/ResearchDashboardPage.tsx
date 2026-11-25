import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Database, FileBarChart, FolderKanban, Info, Plus } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export const ResearchDashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [showNewProj, setShowNewProj] = useState(false);
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');

  const load = async () => {
    const res = await apiRequest('/api/research/dashboard');
    setData(res);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/research/projects', {
        method: 'POST',
        body: JSON.stringify({ title, objective }),
      });
      showToast('Research project created.', 'success');
      setTitle('');
      setObjective('');
      setShowNewProj(false);
      await load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const s = data?.stats || {};
  const pm = data?.primary_metrics || {};

  return (
    <AppLayout title="Research Dashboard" subtitle="De-identified AI performance analytics, research projects, and benchmark datasets">
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sm text-[#0B2D52] flex items-center gap-2.5">
          <Info className="w-5 h-5 text-sky-700 shrink-0" />
          <span>{data?.data_notice || 'De-identified sample benchmark & clinical comparison research environment.'}</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'De-identified Cases', value: s.total_deidentified_cases ?? 0 },
            { label: 'Research Datasets', value: s.datasets_count ?? 0 },
            { label: 'Active Projects', value: s.active_projects ?? 0 },
            { label: 'Live Comparisons', value: s.live_comparisons ?? 0 },
            { label: 'Avg Concordance', value: `${s.avg_live_agreement_score ?? 0}%` },
          ].map((k) => (
            <div key={k.label} className="healthcare-card p-5">
              <div className="text-xs text-slate-500">{k.label}</div>
              <div className="text-2xl font-display font-extrabold text-[#0B2D52] mt-1">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Links to Research Tools */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/research/accuracy" className="healthcare-card p-5 hover:border-teal-400 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-teal-600" />
            <div>
              <div className="font-bold text-sm text-[#0B2D52]">Accuracy Analysis</div>
              <div className="text-xs text-slate-500">Agreement: {pm.agreement_percentage ?? 0}%</div>
            </div>
          </Link>
          <Link to="/research/confusion-matrix" className="healthcare-card p-5 hover:border-teal-400 flex items-center gap-3">
            <FolderKanban className="w-6 h-6 text-sky-600" />
            <div>
              <div className="font-bold text-sm text-[#0B2D52]">Confusion Matrix</div>
              <div className="text-xs text-slate-500">F1: {pm.f1_score ? (pm.f1_score * 100).toFixed(1) + '%' : '—'}</div>
            </div>
          </Link>
          <Link to="/research/datasets" className="healthcare-card p-5 hover:border-teal-400 flex items-center gap-3">
            <Database className="w-6 h-6 text-indigo-600" />
            <div>
              <div className="font-bold text-sm text-[#0B2D52]">Dataset Management</div>
              <div className="text-xs text-slate-500">{s.datasets_count ?? 0} datasets available</div>
            </div>
          </Link>
          <Link to="/research/reports" className="healthcare-card p-5 hover:border-teal-400 flex items-center gap-3">
            <FileBarChart className="w-6 h-6 text-emerald-600" />
            <div>
              <div className="font-bold text-sm text-[#0B2D52]">Research Reports</div>
              <div className="text-xs text-slate-500">Export &amp; publication view</div>
            </div>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="healthcare-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-[#0B2D52]">Active Research Projects</h2>
              <button onClick={() => setShowNewProj(true)} className="px-3 py-1.5 rounded-xl bg-[#0B2D52] text-white text-xs font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> New Project
              </button>
            </div>
            <div className="space-y-3">
              {(data?.projects || []).map((p: any) => (
                <div key={p.id} className="p-4 rounded-xl bg-[#F4F8FC] border border-sky-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0B2D52]">{p.title}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{p.status}</span>
                  </div>
                  <p className="text-xs text-slate-600">{p.objective}</p>
                  {p.findings_summary && <p className="text-xs text-teal-800 pt-1"><strong>Findings:</strong> {p.findings_summary}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="healthcare-card p-6 space-y-4">
            <h2 className="font-display font-bold text-[#0B2D52]">Dataset Summaries</h2>
            <div className="space-y-3">
              {(data?.datasets_summary || []).map((d: any) => (
                <div key={d.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#0B2D52]">{d.name}</div>
                    <div className="text-xs text-slate-500">{d.record_count} de-identified records • Model: {d.ai_model_version}</div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    d.is_validated ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {d.is_validated ? 'Validated' : 'Unvalidated'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showNewProj && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateProject} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-lg text-[#0B2D52]">Create Research Project</h3>
            <input type="text" required placeholder="Project Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            <textarea rows={3} required placeholder="Research Objective" value={objective} onChange={(e) => setObjective(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowNewProj(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#0B2D52] text-white text-sm font-semibold">Create</button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
};
