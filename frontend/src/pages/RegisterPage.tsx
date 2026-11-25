import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const { showToast } = useToast();

  const [role, setRole] = useState<UserRole>('patient');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [qualification, setQualification] = useState('');
  const [medicalSpeciality, setMedicalSpeciality] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [institution, setInstitution] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!consentAccepted) {
      setError('Please accept the Terms and Privacy Policy consent.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone_number: phoneNumber || null,
          password,
          confirm_password: confirmPassword,
          role,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          consent_accepted: consentAccepted,
          qualification: qualification || null,
          medical_speciality: medicalSpeciality || null,
          registration_number: registrationNumber || null,
          hospital_name: hospitalName || null,
          institution: institution || null,
        }),
      });
      loginUser(res.access_token, res.user, true);
      showToast('Account created successfully! Welcome to the platform.', 'success');
      navigate(res.user.role === 'researcher' ? '/research/dashboard' : `/${res.user.role}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF3FB] via-[#F4F8FC] to-[#E6F7F5] py-10 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/"><BrandLogo /></Link>
          <Link to="/login" className="text-sm font-semibold text-teal-700 hover:underline">
            Already registered? Sign In
          </Link>
        </div>

        <div className="healthcare-card p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-[#0B2D52]">Create Your Account</h1>
            <p className="text-sm text-slate-600 mt-1">
              Select your healthcare role to access personalized dashboards and comparison tools.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Register As</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'patient', label: 'Patient' },
                  { id: 'doctor', label: 'Doctor' },
                  { id: 'researcher', label: 'Researcher' },
                  { id: 'admin', label: 'Hospital Admin' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as UserRole)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all ${
                      role === r.id
                        ? 'bg-[#0B2D52] text-white border-[#0B2D52] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Dr. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1-555-0140"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender (Optional)</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>

              {role === 'patient' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              )}

              {role === 'doctor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Medical Speciality</label>
                    <input
                      type="text"
                      value={medicalSpeciality}
                      onChange={(e) => setMedicalSpeciality(e.target.value)}
                      placeholder="e.g., Cardiology"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Qualification</label>
                    <input
                      type="text"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g., MBBS, MD"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Medical Registration #</label>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="e.g., NMC-10429"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hospital / Clinic</label>
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      placeholder="e.g., Metro Care Hospital"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                </>
              )}

              {role === 'researcher' && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Institution / Research Lab</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g., Clinical AI Evaluation Institute"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 cursor-pointer">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 accent-teal-600"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I accept the <strong>Terms of Service</strong> and <strong>Healthcare Privacy Policy</strong>. I understand that AI assessments provide educational decision support only and never replace a licensed human physician.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0B2D52] to-[#0D9488] text-white font-semibold text-sm shadow-md hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {submitting ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Protected with bcrypt password hashing, JWT tokens, and role-based access control.</span>
       