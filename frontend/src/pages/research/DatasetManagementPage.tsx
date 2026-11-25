import React, { useEffect, useState } from 'react';
import { CheckCircle2, Database, Download, Plus, ShieldCheck } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest, downloadProtectedFile } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export const DatasetManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [searchQ, setSearchQ] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [jsonRecords, setJsonRecords] = useState(
    JSON.stringify(
      [
        {
          case_id: 'CUSTOM-01',
          case_date: '2026-11-20',
          ai_prediction: 'Community-Acquired Pneumonia',
          doctor_diagnosis: 'Community-Acquired Pneumonia',
          outcome: 'match',
          actual_positive: true,
          predicted_positive: true,
        },
        {
          case_id: 'CUSTOM-02',
          case_date: '2026-11-21',
          ai_prediction: 'Acute Gastritis',
          doctor_diagnosis: 'Atypical Angina',
          outcome: 'disagree',
          actual_positive: true,
          predicted_positive: false,
        },
      ],
      null,
      2
    )
  );

  const load = async () => {
    const res = await apiRequest('/api/research/datasets');
    setDatasets(res);
    if (res.length > 0 && !selected) setSelected(res[0]);
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(jsonRecords);
      await apiRequest('/api/research/datasets', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: desc,
          source_type: 'uploaded_research_batch',
          records_payload: parsed,
        }),
      });
      showToast('De-identified dataset uploaded successfully.', 'success');
      setShowUpload(false);
      setName('');
      setDesc('');
      await load();
    } catch (err: any) {
      showToast(err.message || 'Invalid JSON records', 'error');
    }
  };

  const handleValidate = async (id: number) => {
    try {
      const res = await apiRequest(`/api/research/datasets/${id}/validate`, { method: 'POST' });
      showToast(
        res.is_validated ? 'Dataset schema validated successfully.' : `Validation found ${res.invalid_rows} invalid row(s).`,
        res.is_validated ? 'success' : 'error'
      );
      await load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredRows = (selected?.records_preview || []).filter((r: any) =>
    `${r.case_id} ${r.ai_prediction} ${r.doctor_diagnosis} ${r.outcome}`.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <AppLayout title="Dataset Management" subtitle="Upload, validate, filter, and export authorized de-identified clinical research datasets">
      <div className="space-y-6">
        <div className="healthcare-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#0B2D52] font-semibold">
            <ShieldCheck className="w-4 h-4 text-teal-600" /> De-identification Guard Active — Only anonymized records permitted.
          </div>
          <button onClick={() => setShowUpload(true)} className="px-4 py-2 rounded-xl bg-[#0B2D52] text-white text-xs font-semibold flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Upload Dataset
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            {datasets.map((d) => (
              <div
                key={d.id}
                onClick={() => setSelected(d)}
                className={`healthcare-card p-4 cursor-pointer border transition-all ${
                  selected?.id === d.id ? 'border-teal-500 bg-sky-50/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-sm text-[#0B2D52] flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-teal-600" /> {d.name}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    d.is_validated ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {d.is_validated ? 'Validated' : 'Needs Check'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{d.description}</p>
                <div className="text-[11px] text-slate-400 mt-2">{d.record_count} records • {d.ai_model_version}</div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-8 healthcare-card p-6 space-y-4">
            {selected ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="font-display font-bold text-lg text-[#0B2D52]">{selected.name}</h2>
                    <p className="text-xs text-slate-500">{selected.record_count} de-identified records</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleValidate(selected.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Validate Schema
                    </button>
                    <button
                      onClick={() => downloadProtectedFile(`/api/research/datasets/${selected.id}/export`, `deidentified_dataset_${selected.id}.csv`)}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Filter records by condition, case ID, or outcome..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F4F8FC] border-b border-slate-200 uppercase text-slate-500">
                      <tr>
                        <th className="p-3">Case ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">AI Prediction</th>
                        <th className="p-3">Doctor Diagnosis</th>
                        <th className="p-3">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.map((r: any, i: number) => (
                        <tr key={i}>
                          <td className="p-3 font-bold text-[#0B2D52]">{r.case_id}</td>
                          <td className="p-3 text-slate-500">{r.case_date}</td>
                          <td className="p-3">{r.ai_prediction}</td>
                          <td className="p-3 font-medium">{r.doctor_diagnosis}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              r.outcome === 'match'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.outcome === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {r.outcome}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Select a dataset to inspect records.</p>
            )}
          </div>
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form onSubmit={handleUpload} className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-lg text-[#0B2D52]">Upload De-identified Research Dataset</h3>
            <input type="text" required placeholder="Dataset Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            <input type="text" placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">JSON Records Array</label>
              <textarea rows={8} value={jsonRecords} onChange={(e) => setJsonRecords(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#0B2D52] text-white text-sm font-semibold">Upload Dataset</button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
};
