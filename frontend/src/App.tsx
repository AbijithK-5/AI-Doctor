import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public & Auth (Pages 1-3)
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';

// Patient Module (Pages 4-11)
import { PatientDashboardPage } from './pages/patient/PatientDashboardPage';
import { PatientProfilePage } from './pages/patient/PatientProfilePage';
import { SymptomCheckerPage } from './pages/patient/SymptomCheckerPage';
import { AIDoctorPage } from './pages/patient/AIDoctorPage';
import { HumanDoctorConsultationPage } from './pages/patient/HumanDoctorConsultationPage';
import { AppointmentsPage } from './pages/patient/AppointmentsPage';
import { MedicalReportsPage } from './pages/patient/MedicalReportsPage';
import { HealthHistoryPage } from './pages/patient/HealthHistoryPage';

// Comparison Module (Pages 12-13)
import { ComparisonDashboardPage } from './pages/comparison/ComparisonDashboardPage';
import { DetailedComparisonReportPage } from './pages/comparison/DetailedComparisonReportPage';

// Research & Accuracy Module (Pages 14-17, 28-30)
import { AccuracyAnalysisPage } from './pages/research/AccuracyAnalysisPage';
import { ConfusionMatrixPage } from './pages/research/ConfusionMatrixPage';
import { DisagreementAnalysisPage } from './pages/research/DisagreementAnalysisPage';
import { ExplainableAIPage } from './pages/research/ExplainableAIPage';
import { ResearchDashboardPage } from './pages/research/ResearchDashboardPage';
import { DatasetManagementPage } from './pages/research/DatasetManagementPage';
import { ResearchReportsPage } from './pages/research/ResearchReportsPage';

// Doctor Module (Pages 18-22)
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage';
import { DoctorProfilePage } from './pages/doctor/DoctorProfilePage';
import { PatientManagementPage } from './pages/doctor/PatientManagementPage';
import { DoctorClinicalAssessmentPage } from './pages/doctor/DoctorClinicalAssessmentPage';
import { DoctorAIReviewPage } from './pages/doctor/DoctorAIReviewPage';

// Admin Module (Pages 23-27)
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { DoctorManagementPage } from './pages/admin/DoctorManagementPage';
import { SystemManagementPage } from './pages/admin/SystemManagementPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';

// Shared Modules (Pages 31-32)
import { NotificationsPage } from './pages/shared/NotificationsPage';
import { SettingsPage } from './pages/shared/SettingsPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Patient Module */}
            <Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboardPage /></ProtectedRoute>} />
            <Route path="/patient/profile" element={<ProtectedRoute allowedRoles={['patient']}><PatientProfilePage /></ProtectedRoute>} />
            <Route path="/patient/symptoms" element={<ProtectedRoute allowedRoles={['patient']}><SymptomCheckerPage /></ProtectedRoute>} />
            <Route path="/patient/ai-doctor" element={<ProtectedRoute allowedRoles={['patient']}><AIDoctorPage /></ProtectedRoute>} />
            <Route path="/patient/consultations" element={<ProtectedRoute allowedRoles={['patient']}><HumanDoctorConsultationPage /></ProtectedRoute>} />
            <Route path="/patient/appointments" element={<ProtectedRoute allowedRoles={['patient']}><AppointmentsPage /></ProtectedRoute>} />
            <Route path="/patient/reports" element={<ProtectedRoute allowedRoles={['patient']}><MedicalReportsPage /></ProtectedRoute>} />
            <Route path="/patient/history" element={<ProtectedRoute allowedRoles={['patient']}><HealthHistoryPage /></ProtectedRoute>} />

            {/* Comparison Engine Module */}
            <Route path="/comparison/dashboard" element={<ProtectedRoute><ComparisonDashboardPage /></ProtectedRoute>} />
            <Route path="/comparison/report" element={<ProtectedRoute><DetailedComparisonReportPage /></ProtectedRoute>} />
            <Route path="/comparison/report/:id" element={<ProtectedRoute><DetailedComparisonReportPage /></ProtectedRoute>} />

            {/* Doctor Module */}
            <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboardPage /></ProtectedRoute>} />
            <Route path="/doctor/profile" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorProfilePage /></ProtectedRoute>} />
            <Route path="/doctor/patients" element={<ProtectedRoute allowedRoles={['doctor']}><PatientManagementPage /></ProtectedRoute>} />
            <Route path="/doctor/assessment" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorClinicalAssessmentPage /></ProtectedRoute>} />
            <Route path="/doctor/ai-review" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorAIReviewPage /></ProtectedRoute>} />

            {/* Research & Accuracy Module */}
            <Route path="/research/dashboard" element={<ProtectedRoute allowedRoles={['researcher', 'admin']}><ResearchDashboardPage /></ProtectedRoute>} />
            <Route path="/researcher/dashboard" element={<ProtectedRoute allowedRoles={['researcher', 'admin']}><ResearchDashboardPage /></ProtectedRoute>} />
            <Route path="/research/accuracy" element={<ProtectedRoute allowedRoles={['researcher', 'admin', 'doctor']}><AccuracyAnalysisPage /></ProtectedRoute>} />
            <Route path="/research/confusion-matrix" element={<ProtectedRoute allowedRoles={['researcher', 'admin', 'doctor']}><ConfusionMatrixPage /></ProtectedRoute>} />
            <Route path="/research/disagreements" element={<ProtectedRoute allowedRoles={['researcher', 'admin', 'doctor']}><DisagreementAnalysisPage /></ProtectedRoute>} />
            <Route path="/research/explainable-ai" element={<ProtectedRoute><ExplainableAIPage /></ProtectedRoute>} />
            <Route path="/research/datasets" element={<ProtectedRoute allowedRoles={['researcher', 'admin']}><DatasetManagementPage /></ProtectedRoute>} />
            <Route path="/research/reports" element={<ProtectedRoute allowedRoles={['researcher', 'admin']}><ResearchReportsPage /></ProtectedRoute>} />

            {/* Admin Module */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />
            <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['admin']}><DoctorManagementPage /></ProtectedRoute>} />
            <Route path="/admin/system" element={<ProtectedRoute allowedRoles={['admin']}><SystemManagementPage /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalyticsPage /></ProtectedRoute>} />

            {/* Shared Modules */}
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
