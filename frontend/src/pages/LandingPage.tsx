import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  FileCheck2,
  GitCompare,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Bot,
      title: 'AI Clinical Decision Support',
      desc: 'Analyses symptom patterns, duration, severity, and medical history using explainable ML to surface educational possibilities and suggested investigations.',
    },
    {
      icon: Stethoscope,
      title: 'Independent Human Doctor Review',
      desc: 'Licensed physicians review the patient case independently—preserving clinical judgment without forcing agreement with AI suggestions.',
    },
    {
      icon: GitCompare,
      title: 'Side-by-Side Comparison Engine',
      desc: 'Highlights exact matches, partial alignment, missed symptoms, risk stratification variances, and investigation differences in clear color-coded panels.',
    },
    {
      icon: BarChart3,
      title: 'Research & Accuracy Analytics',
      desc: 'Provides de-identified concordance metrics (Precision, Recall, F1, Sensitivity, Specificity, Confusion Matrix) and Explainable AI feature weights.',
    },
    {
      icon: FileCheck2,
      title: 'Encrypted Medical Report Vault',
      desc: 'Upload laboratory panels, PDFs, prescriptions, and imaging reports securely linked to consultations and patient timelines.',
    },
    {
      icon: Lock,
      title: 'Role-Based Clinical Governance',
      desc: 'Dedicated dashboards and strict permission boundaries for Patients, Doctors, Researchers, and Hospital Administrators.',
    },
  ];

  const steps = [
    { step: '01', title: 'Patient Profile & Symptoms', desc: 'Register with consent, complete health history, and log structured symptoms with red-flag safety checks.' },
    { step: '02', title: 'AI Decision Support', desc: 'Receive educational possible conditions, missing context, suggested investigations, and follow-up Q&A.' },
    { step: '03', title: 'Human Doctor Consultation', desc: 'Book a verified specialist who conducts an independent physical/telehealth clinical assessment.' },
    { step: '04', title: 'Comparison & Research Insights', desc: 'Review the authoritative side-by-side comparison report, export PDF, and empower de-identified research.' },
  ];

  const demoTestimonials = [
    {
      name: 'Aarav S. (Demo Patient Profile)',
      role: 'Patient Workflow Demonstration',
      quote: 'Seeing the AI summary next to my pulmonologist’s confirmed assessment helped me understand why certain chest imaging tests were ordered.',
    },
    {
      name: 'Dr. Elena Vance, MD (Demo Clinician)',
      role: 'Pulmonology & Internal Medicine',
      quote: 'The review interface lets me evaluate AI suggestions critically, document disagreements clearly, and always keep clinical authority with the physician.',
    },
    {
      name: 'Dr. Liam O’Connor (Demo Researcher)',
      role: 'Clinical AI Evaluation Lab',
      quote: 'De-identified disagreement tracking and interactive confusion matrices make auditing model safety transparent and reproducible.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F8FC] text-[#0F2942]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <BrandLogo />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-[#0B2D52]">Features</a>
            <a href="#how-it-works" className="hover:text-[#0B2D52]">How It Works</a>
            <a href="#benefits" className="hover:text-[#0B2D52]">Benefits</a>
            <a href="#contact" className="hover:text-[#0B2D52]">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={user.role === 'researcher' ? '/research/dashboard' : `/${user.role}/dashboard`}
                className="px-4 py-2.5 rounded-xl bg-[#0B2D52] text-white text-sm font-semibold hover:bg-[#0E3B6B] transition-colors flex items-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-[#0B2D52] hover:bg-slate-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B2D52] to-[#0D9488] text-white text-sm font-semibold shadow-sm hover:opacity-95 transition-opacity"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B2D52] via-[#103E70] to-[#0D6E7A] text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-emerald-300">
              <Sparkles className="w-4 h-4" />
              Intelligent Healthcare. Human Expertise. Better Insights.
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
              AI vs Human Doctor
              <span className="block text-teal-300 mt-1">Smart Healthcare Comparison Platform</span>
            </h1>
            <p className="text-sky-100/90 text-base sm:text-lg leading-relaxed max-w-xl">
              Compare AI-powered clinical decision-support assessments side-by-side with independent, authoritative evaluations from registered human physicians—built for patients, doctors, hospitals, and medical researchers.
            </p>
            <div className="flex flex-wrap gap-3.5 pt-2">
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07213D] font-bold text-sm shadow-lg transition-colors flex items-center gap-2"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-sm transition-colors"
              >
                Explore Demo Accounts
              </Link>
            </div>
            <div className="pt-3 flex items-center gap-2 text-xs text-sky-200/90">
              <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
              <span>AI results are educational decision-support only. The human doctor&apos;s clinical assessment remains authoritative.</span>
            </div>
          </div>

          {/* AI vs Human Comparison Illustration */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-200">Live Comparison Engine Preview</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-semibold">
                84% Clinical Concordance
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white text-[#0F2942] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
                  <Bot className="w-5 h-5" /> AI Doctor (Decision Support)
                </div>
                <div className="text-xs bg-sky-50 border border-sky-200 rounded-lg p-2.5">
                  <div className="font-semibold text-[#0B2D52]">Top Consideration</div>
                  <div className="text-slate-600 mt-0.5">Community-Acquired Pneumonia</div>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <div>• Suggested: Chest X-Ray, CBC, CRP</div>
                  <div>• Risk Tier: <span className="font-semibold text-amber-600">HIGH</span></div>
                </div>
              </div>
              <div className="bg-white text-[#0F2942] rounded-2xl p-4 space-y-2.5 border-2 border-emerald-400">
                <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                  <Stethoscope className="w-5 h-5" /> Human Doctor (Authoritative)
                </div>
                <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                  <div className="font-semibold text-emerald-900">Confirmed Diagnosis</div>
                  <div className="text-emerald-800 mt-0.5">Community-Acquired Pneumonia</div>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <div>• Exam: Right basal crackles</div>
                  <div>• Plan: Allergy-safe targeted Rx</div>
                </div>
              </div>
            </div>
            <div className="bg-[#08223E]/80 rounded-xl px-4 py-3 text-xs text-sky-100 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Agreement verified on primary diagnosis &amp; imaging; physician added Penicillin allergy safeguard.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Platform Architecture</span>
          <h2 className="font-display text-3xl font-bold text-[#0B2D52] mt-2">
            Built for Safe, Transparent Medical AI Comparison
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="healthcare-card p-6 space-y-3">
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#0B2D52] flex items-center justify-center border border-sky-100">
                  <Icon className="w-6 h-6 text-teal-700" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#0B2D52]">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Clinical Workflow</span>
            <h2 className="font-display text-3xl font-bold text-[#0B2D52] mt-2">How the Platform Works</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="rounded-2xl bg-[#F4F8FC] border border-sky-100 p-6 space-y-3">
                <div className="font-display text-2xl font-extrabold text-teal-600">{s.step}</div>
                <h3 className="font-display font-bold text-base text-[#0B2D52]">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits & Testimonials */}
      <section id="benefits" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="healthcare-card p-6 bg-gradient-to-br from-[#0B2D52] to-[#12457A] text-white border-none">
            <Users className="w-8 h-8 text-teal-300 mb-3" />
            <h3 className="font-display text-xl font-bold mb-2">For Patients</h3>
            <p className="text-sm text-sky-100 leading-relaxed">
              Prepare better questions before appointments, organize lab reports, and understand how AI suggestions compare with your doctor&apos;s authoritative plan.
            </p>
          </div>
          <div className="healthcare-card p-6">
            <Stethoscope className="w-8 h-8 text-teal-600 mb-3" />
            <h3 className="font-display text-xl font-bold text-[#0B2D52] mb-2">For Doctors &amp; Hospitals</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Structured symptom intake, rapid AI suggestion auditing (accept/reject/modify), and complete clinical autonomy without algorithmic override.
            </p>
          </div>
          <div className="healthcare-card p-6">
            <Activity className="w-8 h-8 text-sky-600 mb-3" />
            <h3 className="font-display text-xl font-bold text-[#0B2D52] mb-2">For Medical Researchers</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Evaluate model precision, recall, confusion matrices, disagreement trends, and explainable feature weights on de-identified datasets.
            </p>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Platform Perspectives (Demo Content)</span>
              <h2 className="font-display text-2xl font-bold text-[#0B2D52] mt-1">Illustrative Demo Testimonials</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              Clearly Labelled Demo Content
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {demoTestimonials.map((t) => (
              <div key={t.name} className="healthcare-card p-6 space-y-3">
                <p className="text-sm text-slate-600 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="pt-2 border-t border-slate-100">
                  <div className="font-semibold text-sm text-[#0B2D52]">{t.name}</div>
                  <div className="text-xs text-teal-700 font-medium">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Footer */}
      <footer id="contact" className="bg-[#0B2D52] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <BrandLogo light />
            <p className="text-xs text-sky-200/80 leading-relaxed">
              Intelligent Healthcare. Human Expertise. Better Insights. Academic &amp; clinical research prototype demonstrating safe AI decision-support comparison.
            </p>
          </div>
          <div className="space-y-2 text-sm text-sky-100">
            <div className="font-display font-bold text-white mb-2">Contact Information</div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-teal-300" /> support@aivshumandoctor.demo</div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-teal-300" /> +1 (800) 555-CARE</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-teal-300" /> 420 Medical Innovation Way, Boston</div>
          </div>
          <div className="space-y-2 text-sm text-sky-100">
            <div className="font-display font-bold text-white mb-2">Clinical Safety &amp; Governance</div>
            <p className="text-xs text-sky-200/80 leading-relaxed">
              For real-world clinical deployment, appropriate prospective clinical validation, HIPAA/GDPR compliance, security testing, and medical device regulatory review are required.
            </p>
            <div className="pt-2 flex gap-3">
              <Link to="/login" className="text-xs font-semibold text-teal-300 hover:underline">Sign In</Link>
              <Link to="/register" className="text-xs font-semibold text-teal-300 hover:underline">Create Account</Link>
            </div>
          </di