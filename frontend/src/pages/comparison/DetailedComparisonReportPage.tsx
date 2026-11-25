import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, Printer, ShieldCheck } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest, downloadProtectedFile } from '../../lib/api';
import { ComparisonRecord } from '../../types';
import { useToast } from '../../context/ToastContext';

export const DetailedComparisonReportPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [comparisons, setComparisons] = useState<ComparisonRecord[]>([]);
  const [report, setReport] = useState<ComparisonRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const list = await apiRequest<ComparisonRecord[]>('/api/comparisons');
        setComparisons(list);
        if (id) {
          const detail = await apiRequest<ComparisonRecord>(`/api/comparisons/${id}`);
          setReport(detail);
        } else if (list.length > 0) {
          setReport(list[0]);
        }
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleExportPdf = async () => {
    if (!report) return;
    try {
      await downloadProtectedFile(`/api/comparisons/${report.id}/pdf`, `comparison_report_${report.id}.pdf`);
      showToast('Comparison PDF exported successfully.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <AppLayout title="Detailed Comparison Report" subtitle="Comprehensive clinical comparison dossier with PDF export and print formatting">
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !report ? (
        <div className="healthcare-card p-10 text-center text-slate-500">No comparison report available.</div>
      ) : (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="healthcare-card p-4 flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-500">Select Report:</span>
              <select
                value={report.id}
                onChange={(e) => navigate(`/comparison/report/${e.target.value}`)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
              >
                {comparisons.map((c) => (
                  <option key={c.id} value={c.id}>
                    CMP-{c.id} | {c.doctor_assessment?.confirmed_diagnosis} ({c.agreement_score}%)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-[#0B2D52] hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Report
              </button>
              <button
                onClick={handleExportPdf}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B2D52] to-[#0D9488] text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" /> Export to PDF
              </button>
            </div>
          </div>

          {/* Printable Dossier */}
          <div className="healthcare-card p-6 sm:p-10 space-y-6 bg-white">
            <div className="border-b border-slate-200 pb-5 flex flex-wrap justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-teal-700">AI vs Human Doctor – Clinical Comparison Report</div>
                <h2 className="font-display text-2xl font-bold text-[#0B2D52] mt-1">Comparison Record #CMP-{report.id}</h2>
                <p className="text-xs text-slate-500 mt-1">Comparison Date: {new Date(report.compared_at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase ${
                  report.agreement_status === 'agree'
                    ? 'bg-emerald-100 text-emerald-800'
                    : report.agreement_status === 'partial_agree'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {report.agreement_status.replace('_', ' ')} ({report.agreement_score}%)
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-3 text-sm text-[#0B2D52]">
              <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <span><strong>Authoritative Notice:</strong> {report.authoritative_statement}</span>
            </div>

            {/* Patient & Doctor Metadata */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F4F8FC] border border-sky-100 text-sm">
              <div><span className="text-xs text-slate-500 block">Patient</span><strong>{report.patient_name}</strong></div>
              <div><span className="text-xs text-slate-500 block">Age / Gender</span><strong>{report.patient_age ?? 'N/A'} / {report.patient_gender || 'N/A'}</strong></div>
              <div><span className="text-xs text-slate-500 block">Attending Physician</span><strong>{report.doctor_name}</strong></div>
              <div><span className="text-xs text-slate-500 block">Speciality</span><strong>{report.doctor_speciality}</strong></div>
            </div>

            {/* Structured Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0B2D52] text-white text-left">
                    <th className="p-3 rounded-tl-xl">Parameter</th>
                    <th className="p-3">AI Doctor (Decision Support)</th>
                    <th className="p-3 rounded-tr-xl">Human Doctor (Authoritative)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border border-slate-200">
                  <tr>
                    <td className="p-3 font-semibold bg-slate-50">Primary Condition / Diagnosis</td>
                    <td className="p-3">{(report.ai_assessment.possible_conditions || []).map((c) => c.condition_name).join(', ')}</td>
                    <td className="p-3 font-semibold text-emerald-800">{report.doctor_assessment.confirmed_diagnosis}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold bg-slate-50">Symptoms Identified</td>
                    <td className="p-3">{(report.ai_assessment.supporting_symptoms || []).join(', ')}</td>
                    <td className="p-3">{(report.doctor_assessment.symptoms_identified || []).join(', ')}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold bg-slate-50">Recommended Investigations</td>
                    <td className="p-3">{(report.ai_assessment.suggested_investigations || []).join(', ')}</td>
                    <td className="p-3">{(report.doctor_assessment.recommended_investigations || []).join(', ')}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold bg-slate-50">Risk Classification</td>
                    <td className="p-3 uppercase font-semibold">{report.ai_assessment.risk_classification}</td>
                    <td className="p-3 uppercase font-semibold text-emerald-800">{report.doctor_assessment.risk_classification}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold bg-slate-50">Treatment / Guidance</td>
                    <td className="p-3 text-slate-600">Educational decision-support only; no prescription issued.</td>
                    <td className="p-3">{report.doctor_assessment.treatment_plan || 'N/A'} {report.doctor_assessment.prescription ? `| Rx: ${report.doctor_assessment.prescription}` : ''}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <h3 className="font-display font-bold text-sm text-emerald-900">Agreement Analysis</h3>
                <ul className="text-xs text-emerald-900 space-y-1 list-disc list-inside">
                  {report.areas_of_agreement.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
                <h3 className="font-display font-bold text-sm text-rose-900">Disagreement Analysis</h3>
                <ul className="text-xs text-rose-900 space-y-1 list-disc list-inside">
                  {(report.areas_of_disagreement.length ? report.areas_of_disagreement : ['No disagreements recorded.']).map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <h3 className="font-display font-bold text-sm text-[#0B2D52]">Doctor&apos;s Final Clinical Assessment</h3>
              <p className="text-sm text-slate-700">{report.doctor_assessment.clinical_assessment}</p>
              <p className="text-xs text-slate-500">Clinical Observations: {report.doctor_assessment.clinical_observations}</p>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
