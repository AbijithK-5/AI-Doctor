import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, CheckCircle2, Search, ShieldCheck, Star, Stethoscope, Video } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export const HumanDoctorConsultationPage: React.FC = () => {
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [aiAssessments, setAiAssessments] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [scheduledAt, setScheduledAt] = useState('2026-12-05T10:30');
  const [consultType, setConsultType] = useState<'online' | 'in_person'>('online');
  const [selectedAiId, setSelectedAiId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);

  const loadAll = async () => {
    const [docs, cons, ais] = await Promise.all([
      apiRequest('/api/patient/doctors'),
      apiRequest('/api/patient/consultations'),
      apiRequest('/api/patient/ai-assessments'),
    ]);
    setDoctors(docs);
    setConsultations(cons);
    setAiAssessments(ais);
    if (ais.length > 0 && !selectedAiId) setSelectedAiId(String(ais[0].id));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredDoctors = doctors.filter((d) =>
    `${d.full_name} ${d.medical_speciality} ${d.hospital_name || ''}`.toLowerCase().includes(searchQ.toLowerCase())
  );

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setBooking(true);
    try {
      const aiObj = aiAssessments.find((a) => String(a.id) === selectedAiId);
      await apiRequest('/api/patient/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctor_id: selectedDoctor.doctor_id,
          scheduled_at: new Date(scheduledAt).toISOString(),
          consultation_type: consultType,
          ai_assessment_id: aiObj ? aiObj.id : null,
          symptom_record_id: aiObj?.symptom_record_id || null,
          reason: reason || 'Requesting human doctor clinical assessment & AI comparison',
          share_ai_with_doctor: true,
        }),
      });
      showToast(`Consultation booked with ${selectedDoctor.full_name}!`, 'success');
      setSelectedDoctor(null);
      setReason('');
      await loadAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setBooking(false);
    }
  };

  return (
    <AppLayout title="Human Doctor Consultation" subtitle="Search verified physicians, book consultations, and share symptoms for authoritative comparison">
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="healthcare-card p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search doctors by name, speciality (e.g. Cardiology, Pulmonology), or hospital..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <Link to="/patient/appointments" className="px-4 py-2.5 rounded-xl bg-sky-50 text-[#0B2D52] text-sm font-semibold border border-sky-200 hover:bg-sky-100 shrink-0">
            Manage Appointments
          </Link>
        </div>

        {/* Doctor Directory */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <div key={doc.doctor_id} className="healthcare-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#0B2D52]">{doc.full_name}</h3>
                    <div className="text-xs font-semibold text-teal-700">{doc.medical_speciality}</div>
                  </div>
                  {doc.verification_status === 'verified' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{doc.bio || doc.qualification}</p>
                <div className="text-xs text-slate-500 space-y-1">
                  <div><strong>Qualification:</strong> {doc.qualification}</div>
                  <div><strong>Experience:</strong> {doc.years_of_experience} years • <strong>Hospital:</strong> {doc.hospital_name || 'Partner Center'}</div>
                  <div className="flex items-center gap-1 text-amber-600 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> {doc.rating} • Reg: {doc.registration_number}
                  </div>
                  <div>
                    <strong>Availability:</strong> {(doc.availability_schedule?.days || ['Mon-Fri']).join(', ')} ({doc.availability_schedule?.hours || '09:00-17:00'})
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDoctor(doc)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0B2D52] to-[#0D9488] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-95"
              >
                <CalendarPlus className="w-4 h-4" /> Book Consultation
              </button>
            </div>
          ))}
        </div>

        {/* Consultation History & Clinical Assessments */}
        <div className="healthcare-card p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#0B2D52] flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" /> Consultation History &amp; Doctor Assessments
          </h2>
          {consultations.length === 0 ? (
            <p className="text-sm text-slate-500">No consultations recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {consultations.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl border border-slate-200 bg-[#F9FBFE] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-[#0B2D52]">{c.doctor_name}</span>
                      <span className="text-xs text-teal-700 ml-2">({c.speciality})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        c.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </span>
                      {c.comparison_id && (
                        <Link
                          to={`/comparison/report/${c.comparison_id}`}
                          className="px-3 py-1 rounded-lg bg-[#0B2D52] text-white text-xs font-semibold hover:bg-[#134275]"
                        >
                          View Comparison
                        </Link>
                      )}
                    </div>
                  </div>
                  {c.doctor_assessment ? (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Confirmed Diagnosis: {c.doctor_assessment.confirmed_diagnosis}
                      </div>
                      <p className="text-slate-700"><strong>Clinical Assessment:</strong> {c.doctor_assessment.clinical_assessment}</p>
                      {c.doctor_assessment.treatment_plan && (
                        <p className="text-slate-700"><strong>Treatment Plan:</strong> {c.doctor_assessment.treatment_plan}</p>
                      )}
                      {c.doctor_assessment.prescription && (
                        <p className="text-slate-700"><strong>Prescription:</strong> {c.doctor_assessment.prescription}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Awaiting physician clinical review.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-lg text-[#0B2D52]">
              Book Consultation with {selectedDoctor.full_name}
            </h3>
            <p className="text-xs text-teal-700 font-semibold">{selectedDoctor.medical_speciality} • {selectedDoctor.hospital_name}</p>
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConsultType('online')}
                    className={`py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      consultType === 'online' ? 'bg-[#0B2D52] text-white border-[#0B2D52]' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <Video className="w-4 h-4" /> Online Telehealth
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultType('in_person')}
                    className={`py-2.5 rounded-xl border text-xs font-semibold ${
                      consultType === 'in_person' ? 'bg-[#0B2D52] text-white border-[#0B2D52]' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    In-Person Clinic
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Attach AI Assessment for Side-by-Side Comparison</label>
                <select
                  value={selectedAiId}
                  onChange={(e) => setSelectedAiId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="">None (Standard Consultation)</option>
                  {aiAssessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.id} — {a.possible_conditions?.[0]?.condition_name || 'AI Assessment'} ({a.risk_classification})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Visit</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe symptoms or request doctor comparison review..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSelectedDoctor(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={booking} className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700">
                  {booking ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
