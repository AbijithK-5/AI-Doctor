import React, { useEffect, useState } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest, downloadProtectedFile } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export const MedicalReportsPage: React.FC = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [filterCat, setFilterCat] = useState('all');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('laboratory');
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [consultationId, setConsultationId] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    const [rpts, cons] = await Promise.all([
      apiRequest(`/api/patient/reports?category=${filterCat}`),
      apiRequest('/api/patient/consultations'),
    ]);
    setReports(rpts);
    setConsultations(cons);
  };

  useEffect(() => {
    loadData();
  }, [filterCat]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      showToast('Select a file and enter a report title.', 'error');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('category', category);
      fd.append('report_date', reportDate);
      if (consultationId) fd.append('consultation_id', consultationId);
      if (notes) fd.append('notes', notes);
      fd.append('file', file);
      await apiRequest('/api/patient/reports', { method: 'POST', body: fd });
      showToast('Medical report uploaded securely.', 'success');
      setTitle('');
      setNotes('');
      setFile(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/patient/reports/${id}`, { method: 'DELETE' });
      showToast('Report deleted.', 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <AppLayout title="Medical Reports" subtitle="Securely upload, organize, download, and associate lab, diagnostic, and prescription files">
      <div className="grid lg:grid-cols-3 gap-6">
        <form onSubmit={handleUpload} className="healthcare-card p-6 space-y-4 h-fit">
          <h2 className="font-display font-bold text-lg text-[#0B2D52] flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600" /> Upload Report
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Report Title *</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Chest X-Ray / Blood Panel" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
              <option value="pdf_report">PDF Medical Report</option>
              <option value="laboratory">Laboratory Report</option>
              <option value="prescription">Prescription</option>
              <option value="diagnostic">Diagnostic / Imaging</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Report Date *</label>
            <input type="date" required value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Associate Consultation (Optional)</label>
            <select value={consultationId} onChange={(e) => setConsultationId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
              <option value="">None</option>
              {consultations.map((c) => (
                <option key={c.id} value={c.id}>Consultation #{c.id} ({c.doctor_name})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">File (PDF, PNG, JPG, TXT, CSV) *</label>
            <input type="file" required accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.json" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-sky-50 file:text-[#0B2D52] file:font-semibold" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Summary or lab notes" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <button type="submit" disabled={uploading} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0B2D52] to-[#0D9488] text-white font-semibold text-sm">
            {uploading ? 'Uploading...' : 'Upload Securely'}
          </button>
        </form>

        <div className="lg:col-span-2 healthcare-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display font-bold text-lg text-[#0B2D52]">Uploaded Medical Documents ({reports.length})</h2>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
              <option value="all">All Categories</option>
              <option value="pdf_report">PDF Medical Report</option>
              <option value="laboratory">Laboratory</option>
              <option value="prescription">Prescription</option>
              <option value="diagnostic">Diagnostic</option>
            </select>
          </div>

          {reports.length === 0 ? (
            <p className="text-sm text-slate-500">No medical reports found for this filter.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-sky-300">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-teal-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#0B2D52]">{r.title}</div>
                      <div className="text-xs text-slate-500">
                        {r.category.replace('_', ' ').toUpperCase()} • {r.report_date} • {r.file_name} ({Math.max(1, Math.round((r.file_size_bytes || 0) / 1024))} KB)
                      </div>
                      {r.notes && <div className="text-xs text-slate-600 mt-0.5">{r.notes}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => downloadProtectedFile(`/api/patient/reports/${r.id}/download`, r.file_name)}
                      className="px-3 py-1.5 rounded-lg bg-sky-50 text-[#0B2D52] text-xs font-semibold hover:bg-sky-100 flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
