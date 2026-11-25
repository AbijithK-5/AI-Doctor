-- AI vs Human Doctor – Smart Healthcare Comparison Platform
-- PostgreSQL Relational Database Schema (20 Core Tables)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(160) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(40),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('patient', 'doctor', 'researcher', 'admin')),
    date_of_birth DATE,
    gender VARCHAR(32),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'deleted')),
    consent_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    consent_accepted_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Hospital Profiles
CREATE TABLE IF NOT EXISTS hospital_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    registration_code VARCHAR(100) UNIQUE,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Global',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(40),
    accreditation_status VARCHAR(64) DEFAULT 'verified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Patient Profiles
CREATE TABLE IF NOT EXISTS patient_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER,
    gender VARCHAR(32),
    blood_group VARCHAR(16),
    height_cm NUMERIC(5,2),
    weight_kg NUMERIC(5,2),
    known_allergies JSONB NOT NULL DEFAULT '[]'::jsonb,
    existing_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    current_medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    family_medical_history TEXT,
    emergency_contact_name VARCHAR(160),
    emergency_contact_phone VARCHAR(40),
    emergency_contact_relation VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Doctor Profiles
CREATE TABLE IF NOT EXISTS doctor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    hospital_id INTEGER REFERENCES hospital_profiles(id) ON DELETE SET NULL,
    qualification VARCHAR(200) NOT NULL,
    medical_speciality VARCHAR(160) NOT NULL,
    registration_number VARCHAR(120) NOT NULL UNIQUE,
    years_of_experience INTEGER NOT NULL DEFAULT 0,
    hospital_name VARCHAR(200),
    contact_info VARCHAR(255),
    availability_schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
    profile_photo_url TEXT,
    bio TEXT,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    rating NUMERIC(3,2) DEFAULT 4.80,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doctor_speciality ON doctor_profiles(medical_speciality);
CREATE INDEX IF NOT EXISTS idx_doctor_verification ON doctor_profiles(verification_status);

-- 5. Researcher Profiles
CREATE TABLE IF NOT EXISTS researcher_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    institution VARCHAR(200),
    department VARCHAR(160),
    research_focus TEXT,
    orcid_id VARCHAR(64),
    ethics_clearance_id VARCHAR(120),
    access_tier VARCHAR(32) NOT NULL DEFAULT 'deidentified_read',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Doctor Verification
CREATE TABLE IF NOT EXISTS doctor_verification (
    id SERIAL PRIMARY KEY,
    doctor_profile_id INTEGER NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    submitted_license_number VARCHAR(120) NOT NULL,
    issuing_authority VARCHAR(200) NOT NULL,
    document_reference TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Symptoms Catalog
CREATE TABLE IF NOT EXISTS symptoms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    body_system VARCHAR(100),
    is_red_flag BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_symptoms_name ON symptoms(name);

-- 8. Patient Symptom Records
CREATE TABLE IF NOT EXISTS patient_symptom_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    main_symptom VARCHAR(160) NOT NULL,
    additional_symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
    duration VARCHAR(80) NOT NULL,
    severity VARCHAR(32) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    frequency VARCHAR(80),
    body_location VARCHAR(120),
    onset_date DATE,
    relevant_medical_history TEXT,
    existing_medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    additional_notes TEXT,
    emergency_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_symptom_records_patient ON patient_symptom_records(patient_id, created_at DESC);

-- 9. AI Assessments
CREATE TABLE IF NOT EXISTS ai_assessments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symptom_record_id INTEGER REFERENCES patient_symptom_records(id) ON DELETE SET NULL,
    model_name VARCHAR(120) NOT NULL,
    model_version VARCHAR(64) NOT NULL,
    is_demo_mode BOOLEAN NOT NULL DEFAULT TRUE,
    primary_summary TEXT NOT NULL,
    possible_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    supporting_symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_information JSONB NOT NULL DEFAULT '[]'::jsonb,
    suggested_investigations JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_classification VARCHAR(32) NOT NULL CHECK (risk_classification IN ('low', 'moderate', 'high', 'urgent')),
    follow_up_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    general_health_education TEXT,
    ai_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    explainability_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    disclaimer_text TEXT NOT NULL,
    saved_by_patient BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_assessments_patient ON ai_assessments(patient_id, created_at DESC);

-- 10. AI Prediction Records
CREATE TABLE IF NOT EXISTS ai_prediction_records (
    id SERIAL PRIMARY KEY,
    ai_assessment_id INTEGER NOT NULL REFERENCES ai_assessments(id) ON DELETE CASCADE,
    condition_name VARCHAR(200) NOT NULL,
    icd_code VARCHAR(32),
    probability_score NUMERIC(5,4),
    is_calibrated BOOLEAN NOT NULL DEFAULT FALSE,
    rank_order INTEGER NOT NULL DEFAULT 1,
    supporting_features JSONB NOT NULL DEFAULT '[]'::jsonb,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symptom_record_id INTEGER REFERENCES patient_symptom_records(id) ON DELETE SET NULL,
    ai_assessment_id INTEGER REFERENCES ai_assessments(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    consultation_type VARCHAR(32) NOT NULL DEFAULT 'online' CHECK (consultation_type IN ('online', 'in_person')),
    status VARCHAR(32) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'rescheduled', 'completed', 'cancelled')),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id, scheduled_at DESC);

-- 12. Consultations
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symptom_record_id INTEGER REFERENCES patient_symptom_records(id) ON DELETE SET NULL,
    ai_assessment_id INTEGER REFERENCES ai_assessments(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'in_progress', 'completed')),
    shared_ai_for_comparison BOOLEAN NOT NULL DEFAULT TRUE,
    doctor_notes TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Doctor Assessments
CREATE TABLE IF NOT EXISTS doctor_assessments (
    id SERIAL PRIMARY KEY,
    consultation_id INTEGER NOT NULL UNIQUE REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinical_observations TEXT NOT NULL,
    symptoms_identified JSONB NOT NULL DEFAULT '[]'::jsonb,
    clinical_assessment TEXT NOT NULL,
    confirmed_diagnosis VARCHAR(240) NOT NULL,
    differential_diagnoses JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_investigations JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_classification VARCHAR(32) NOT NULL CHECK (risk_classification IN ('low', 'moderate', 'high', 'urgent')),
    treatment_plan TEXT,
    prescription TEXT,
    additional_notes TEXT,
    ai_suggestion_reviews JSONB NOT NULL DEFAULT '[]'::jsonb,
    disagreement_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Medical Reports
CREATE TABLE IF NOT EXISTS medical_reports (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consultation_id INTEGER REFERENCES consultations(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(64) NOT NULL CHECK (category IN ('pdf_report', 'laboratory', 'prescription', 'diagnostic', 'other')),
    file_name VARCHAR(255) NOT NULL,
    stored_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    report_date DATE NOT NULL,
    notes TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medical_reports_patient ON medical_reports(patient_id, report_date DESC);

-- 15. Comparison Results
CREATE TABLE IF NOT EXISTS comparison_results (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consultation_id INTEGER NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    ai_assessment_id INTEGER NOT NULL REFERENCES ai_assessments(id) ON DELETE CASCADE,
    doctor_assessment_id INTEGER NOT NULL REFERENCES doctor_assessments(id) ON DELETE CASCADE,
    agreement_status VARCHAR(32) NOT NULL CHECK (agreement_status IN ('agree', 'partial_agree', 'disagree')),
    agreement_score NUMERIC(5,2) NOT NULL,
    matching_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    different_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    shared_symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
    similar_investigations JSONB NOT NULL DEFAULT '[]'::jsonb,
    different_investigations JSONB NOT NULL DEFAULT '[]'::jsonb,
    areas_of_agreement JSONB NOT NULL DEFAULT '[]'::jsonb,
    areas_of_disagreement JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_comparison JSONB NOT NULL DEFAULT '{}'::jsonb,
    treatment_comparison TEXT,
    authoritative_statement TEXT NOT NULL,
    compared_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comparisons_patient ON comparison_results(patient_id, compared_at DESC);

-- 16. Research Datasets
CREATE TABLE IF NOT EXISTS research_datasets (
    id SERIAL PRIMARY KEY,
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    source_type VARCHAR(64) NOT NULL DEFAULT 'sample_benchmark',
    is_validated BOOLEAN NOT NULL DEFAULT FALSE,
    is_deidentified BOOLEAN NOT NULL DEFAULT TRUE,
    record_count INTEGER NOT NULL DEFAULT 0,
    ai_model_version VARCHAR(64) NOT NULL,
    schema_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    records_payload JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Accuracy Metrics
CREATE TABLE IF NOT EXISTS accuracy_metrics (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES research_datasets(id) ON DELETE CASCADE,
    model_version VARCHAR(64) NOT NULL,
    condition_filter VARCHAR(160) DEFAULT 'all',
    total_cases INTEGER NOT NULL,
    matching_predictions INTEGER NOT NULL,
    partial_predictions INTEGER NOT NULL,
    non_matching_predictions INTEGER NOT NULL,
    accuracy NUMERIC(6,4) NOT NULL,
    precision_score NUMERIC(6,4) NOT NULL,
    recall_score NUMERIC(6,4) NOT NULL,
    f1_score NUMERIC(6,4) NOT NULL,
    sensitivity NUMERIC(6,4) NOT NULL,
    specificity NUMERIC(6,4) NOT NULL,
    true_positives INTEGER NOT NULL,
    true_negatives INTEGER NOT NULL,
    false_positives INTEGER NOT NULL,
    false_negatives INTEGER NOT NULL,
    is_sample_data BOOLEAN NOT NULL DEFAULT TRUE,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Research Projects
CREATE TABLE IF NOT EXISTS research_projects (
    id SERIAL PRIMARY KEY,
    lead_researcher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(240) NOT NULL,
    objective TEXT NOT NULL,
    dataset_id INTEGER REFERENCES research_datasets(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    findings_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link_url VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- 20. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    actor_role VARCHAR(32),
    action VARCHAR(120) NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id VARCHAR(80),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
