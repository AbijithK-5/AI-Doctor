import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Search, Users } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest, downloadProtectedFile } from '../../lib/api';

export const PatientManagementPage: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    apiRequest(`/api/doctor/patients?q=${encodeURIComponent(searchQ)}`).then(setPatients);
  }, [searchQ]);

  const loadPatientDetail = async (id: number) => {
    const res = await apiRequest(`/api/doctor/patients/${id}`);
    setDetail(res);
  };

  return (
    <AppLayout title="Patient Management" subtitle="Search patients and inspect medical histories, uploaded reports, AI assessments, and comparisons">
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 healthcare-card p-5 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search patients by name or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div className="space-y-2.5">
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => loadPatientDetail(p.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  detail?.patient?.id === p.id ? 'bg-sky-50 border-teal-500' : 'bg-white border-slate-200 hover:border-sky-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#0B2D52]">{p.full_name}</span>
                  <span className="text-[11px] font-semibold text-teal-700">{p.blood_group || 'N/A'}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{p.email} • Age: {p.age ?? '—'}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Consultations: {p.consultations_count} • AI Assessments: {p.ai_assessments_count}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 healthcare-card p-6">
          {!detail ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Users className="w-10 h-10" />
              <p className="text-sm">Select a patient on the left to review their complete medical dossier.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-4 flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#0B2D52]">{detail.patient.full_name}</h2>
                  <p className="text-xs text-slate-500">
                    Age: {detail.patient.age ?? 'N/A'} • Gender: {detail.patient.gender || 'N/A'} • Blood Group: {detail.patient.blood_group || 'N/A'}
                  </p>
                </div>
                <Link to="/doctor/assessment" className="px-3.5 py-2 rounded-xl bg-[#0B2D52] text-white text-xs font-semibold h-fit">
                  Open Clinical Assessment
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <strong className="text-rose-900 block">Known Allergies</strong>
                  {(detail.patient.known_allergies || []).join(', ') || 'None'}
                </div>
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                  <strong className="text-[#0B2D52] block">Existing Conditions</strong>
                  {(detail.patient.existing_conditions || []).join(', ') || 'None'}
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-sm text-[#0B2D52] mb-2">Recent Symptom Records</h3>
                <div className="space-y-2">
                  {detail.symptom_records.map((s: any) => (
                    <div key={s.id} className="p-3 rounded-xl bg-[#F4F8FC] border border-sky-100 text-xs">
                      <strong>{s.main_symptom}</strong> ({s.severity}, {s.duration}) — {(s.additional_symptoms || []).join(', ')}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-sm text-[#0B2D52] mb-2">Uploaded Medical Reports</h3>
                <div className="space-y-2">
                  {detail.reports.length === 0 ? (
                    <p className="text-xs text-slate-500">No uploaded reports.</p>
                  ) : (
                    detail.reports.map((r: any) => (
                      <div key={r.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <span><strong>{r.title}</strong> ({r.category} • {r.report_date})</span>
                        <button
                          onClick={() => downloadProtectedFile(`/api/patient/reports/${r.id}/download`, r.file_name)}
                          className="text-teal-700 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" /> View/Download
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-sm text-[#0B2D52] mb-2">Comparison History</h3>
                <div className="flex flex-wrap gap-2">
                  {detail.comparisons.map((c: any) => (
                    <Link key={c.id} to={`/comparison/report/${c.id}`} className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
                      CMP-{c.id}: {c.agreement_score}% ({c.agreement_status.replace('_', ' ')})
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
