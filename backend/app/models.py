from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(160), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone_number = Column(String(40), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False, index=True)  # patient, doctor, researcher, admin
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(32), nullable=True)
    status = Column(String(32), nullable=False, default="active")  # active, suspended, pending, deleted
    consent_accepted = Column(Boolean, nullable=False, default=False)
    consent_accepted_at = Column(DateTime(timezone=True), nullable=True)
    notification_preferences = Column(JSON, nullable=False, default=lambda: {
        "email_alerts": True,
        "appointment_reminders": True,
        "ai_completion": True,
        "comparison_ready": True,
    })
    privacy_settings = Column(JSON, nullable=False, default=lambda: {
        "allow_deidentified_research": True,
        "share_reports_with_assigned_doctor": True,
    })
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    researcher_profile = relationship("ResearcherProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class HospitalProfile(Base):
    __tablename__ = "hospital_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    registration_code = Column(String(100), unique=True, nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), default="Global")
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(40), nullable=True)
    accreditation_status = Column(String(64), default="verified")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(32), nullable=True)
    blood_group = Column(String(16), nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    known_allergies = Column(JSON, nullable=False, default=list)
    existing_conditions = Column(JSON, nullable=False, default=list)
    current_medications = Column(JSON, nullable=False, default=list)
    family_medical_history = Column(Text, nullable=True)
    emergency_contact_name = Column(String(160), nullable=True)
    emergency_contact_phone = Column(String(40), nullable=True)
    emergency_contact_relation = Column(String(80), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="patient_profile")


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    hospital_id = Column(Integer, ForeignKey("hospital_profiles.id", ondelete="SET NULL"), nullable=True)
    qualification = Column(String(200), nullable=False, default="MD, General Medicine")
    medical_speciality = Column(String(160), nullable=False, default="Internal Medicine", index=True)
    registration_number = Column(String(120), nullable=False, unique=True)
    years_of_experience = Column(Integer, nullable=False, default=1)
    hospital_name = Column(String(200), nullable=True)
    contact_info = Column(String(255), nullable=True)
    availability_schedule = Column(JSON, nullable=False, default=dict)
    profile_photo_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    verification_status = Column(String(32), nullable=False, default="pending", index=True)  # pending, verified, rejected
    rating = Column(Float, default=4.8)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="doctor_profile")


class ResearcherProfile(Base):
    __tablename__ = "researcher_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    institution = Column(String(200), nullable=True)
    department = Column(String(160), nullable=True)
    research_focus = Column(Text, nullable=True)
    orcid_id = Column(String(64), nullable=True)
    ethics_clearance_id = Column(String(120), nullable=True)
    access_tier = Column(String(32), nullable=False, default="deidentified_read")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="researcher_profile")


class DoctorVerification(Base):
    __tablename__ = "doctor_verification"

    id = Column(Integer, primary_key=True, index=True)
    doctor_profile_id = Column(Integer, ForeignKey("doctor_profiles.id", ondelete="CASCADE"), nullable=False)
    submitted_license_number = Column(String(120), nullable=False)
    issuing_authority = Column(String(200), nullable=False)
    document_reference = Column(Text, nullable=True)
    status = Column(String(32), nullable=False, default="pending")  # pending, approved, rejected
    reviewed_by_admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)


class Symptom(Base):
    __tablename__ = "symptoms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False, unique=True, index=True)
    category = Column(String(100), nullable=False)
    body_system = Column(String(100), nullable=True)
    is_red_flag = Column(Boolean, nullable=False, default=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)


class PatientSymptomRecord(Base):
    __tablename__ = "patient_symptom_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    main_symptom = Column(String(160), nullable=False)
    additional_symptoms = Column(JSON, nullable=False, default=list)
    duration = Column(String(80), nullable=False)
    severity = Column(String(32), nullable=False)  # mild, moderate, severe, critical
    frequency = Column(String(80), nullable=True)
    body_location = Column(String(120), nullable=True)
    onset_date = Column(Date, nullable=True)
    relevant_medical_history = Column(Text, nullable=True)
    existing_medications = Column(JSON, nullable=False, default=list)
    additional_notes = Column(Text, nullable=True)
    emergency_flagged = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, index=True)


class AIAssessment(Base):
    __tablename__ = "ai_assessments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    symptom_record_id = Column(Integer, ForeignKey("patient_symptom_records.id", ondelete="SET NULL"), nullable=True)
    model_name = Column(String(120), nullable=False)
    model_version = Column(String(64), nullable=False)
    is_demo_mode = Column(Boolean, nullable=False, default=True)
    primary_summary = Column(Text, nullable=False)
    possible_conditions = Column(JSON, nullable=False, default=list)
    supporting_symptoms = Column(JSON, nullable=False, default=list)
    missing_information = Column(JSON, nullable=False, default=list)
    suggested_investigations = Column(JSON, nullable=False, default=list)
    risk_classification = Column(String(32), nullable=False)  # low, moderate, high, urgent
    follow_up_questions = Column(JSON, nullable=False, default=list)
    general_health_education = Column(Text, nullable=True)
    ai_recommendations = Column(JSON, nullable=False, default=list)
    explainability_factors = Column(JSON, nullable=False, default=list)
    chat_history = Column(JSON, nullable=False, default=list)
    disclaimer_text = Column(Text, nullable=False)
    saved_by_patient = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, index=True)


class AIPredictionRecord(Base):
    __tablename__ = "ai_prediction_records"

    id = Column(Integer, primary_key=True, index=True)
    ai_assessment_id = Column(Integer, ForeignKey("ai_assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    condition_name = Column(String(200), nullable=False)
    icd_code = Column(String(32), nullable=True)
    probability_score = Column(Float, nullable=True)
    is_calibrated = Column(Boolean, nullable=False, default=False)
    rank_order = Column(Integer, nullable=False, default=1)
    supporting_features = Column(JSON, nullable=False, default=list)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    symptom_record_id = Column(Integer, ForeignKey("patient_symptom_records.id", ondelete="SET NULL"), nullable=True)
    ai_assessment_id = Column(Integer, ForeignKey("ai_assessments.id", ondelete="SET NULL"), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    consultation_type = Column(String(32), nullable=False, default="online")  # online, in_person
    status = Column(String(32), nullable=False, default="scheduled")  # scheduled, rescheduled, completed, cancelled
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="SET NULL"), unique=True, nullable=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    symptom_record_id = Column(Integer, ForeignKey("patient_symptom_records.id", ondelete="SET NULL"), nullable=True)
    ai_assessment_id = Column(Integer, ForeignKey("ai_assessments.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(32), nullable=False, default="pending_review")  # pending_review, in_progress, completed
    shared_ai_for_comparison = Column(Boolean, nullable=False, default=True)
    doctor_notes = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)


class DoctorAssessment(Base):
    __tablename__ = "doctor_assessments"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False, unique=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    clinical_observations = Column(Text, nullable=False)
    symptoms_identified = Column(JSON, nullable=False, default=list)
    clinical_assessment = Column(Text, nullable=False)
    confirmed_diagnosis = Column(String(240), nullable=False)
    differential_diagnoses = Column(JSON, nullable=False, default=list)
    recommended_investigations = Column(JSON, nullable=False, default=list)
    risk_classification = Column(String(32), nullable=False)
    treatment_plan = Column(Text, nullable=True)
    prescription = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)
    ai_suggestion_reviews = Column(JSON, nullable=False, default=list)
    disagreement_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)


class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    category = Column(String(64), nullable=False)  # pdf_report, laboratory, prescription, diagnostic, other
    file_name = Column(String(255), nullable=False)
    stored_path = Column(String(500), nullable=False)
    mime_type = Column(String(120), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    report_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)


class ComparisonResult(Base):
    __tablename__ = "comparison_results"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False, index=True)
    ai_assessment_id = Column(Integer, ForeignKey("ai_assessments.id", ondelete="CASCADE"), nullable=False)
    doctor_assessment_id = Column(Integer, ForeignKey("doctor_assessments.id", ondelete="CASCADE"), nullable=False)
    agreement_status = Column(String(32), nullable=False)  # agree, partial_agree, disagree
    agreement_score = Column(Float, nullable=False)
    matching_conditions = Column(JSON, nullable=False, default=list)
    different_conditions = Column(JSON, nullable=False, default=list)
    shared_symptoms = Column(JSON, nullable=False, default=list)
    missing_symptoms = Column(JSON, nullable=False, default=list)
    similar_investigations = Column(JSON, nullable=False, default=list)
    different_investigations = Column(JSON, nullable=False, default=list)
    areas_of_agreement = Column(JSON, nullable=False, default=list)
    areas_of_disagreement = Column(JSON, nullable=False, default=list)
    risk_comparison = Column(JSON, nullable=False, default=dict)
    treatment_comparison = Column(Text, nullable=True)
    authoritative_statement = Column(Text, nullable=False)
    compared_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, index=True)


class ResearchDataset(Base):
    __tablename__ = "research_datasets"

    id = Column(Integer, primary_key=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    source_type = Column(String(64), nullable=False, default="sample_benchmark")
    is_validated = Column(Boolean, nullable=False, default=False)
    is_deidentified = Column(Boolean, nullable=False, default=True)
    record_count = Column(Integer, nullable=False, default=0)
    ai_model_version = Column(String(64), nullable=False)
    schema_metadata = Column(JSON, nullable=False, default=dict)
    records_payload = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)


class AccuracyMetric(Base):
    __tablename__ = "accuracy_metrics"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("research_datasets.id", ondelete="CASCADE"), nullable=True)
    model_version = Column(String(64), nullable=False)
    condition_filter = Column(String(160), default="all")
    total_cases = Column(Integer, nullable=False)
    matching_predictions = Column(Integer, nullable=False)
    partial_predictions = Column(Integer, nullable=False)
    non_matching_predictions = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=False)
    precision_score = Column(Float, nullable=False)
    recall_score = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    sensitivity = Column(Float, nullable=False)
    specificity = Column(Float, nullable=False)
    true_positives = Column(Integer, nullable=False)
    true_negatives = Column(Integer, nullable=False)
    false_positives = Column(Integer, nullable=False)
    false_negatives = Column(Integer, nullable=False)
    is_sample_data = Column(Boolean, nullable=False, default=True)
    computed_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)


class ResearchProject(Base):
    __tablename__ = "research_projects"

    id = Column(Integer, primary_key=True, index=True)
    lead_researcher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(240), nullable=False)
    objective = Column(Text, nullable=False)
    dataset_id = Column(Integer, ForeignKey("research_datasets.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(32), nullable=False, default="active")
    findings_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(64), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    link_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, index=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_role = Column(String(32), nullable=True)
    action = Column(String(120), nullable=False)
    resource_type = Column(String(80), nullable=False)
    resource_id = Column(String(80), nullable=True)
    details = Column(JSON, nullable=False, default=dict)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, index=True)
