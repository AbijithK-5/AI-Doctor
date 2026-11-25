from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=160)
    email: EmailStr
    phone_number: Optional[str] = None
    password: str = Field(..., min_length=6, max_length=128)
    confirm_password: str
    role: str = Field(..., pattern="^(patient|doctor|researcher|admin)$")
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    consent_accepted: bool
    # Optional role-specific fields
    qualification: Optional[str] = None
    medical_speciality: Optional[str] = None
    registration_number: Optional[str] = None
    hospital_name: Optional[str] = None
    institution: Optional[str] = None
    research_focus: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None
    remember_me: bool = False


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class UserSettingsUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    notification_preferences: Optional[Dict[str, bool]] = None
    privacy_settings: Optional[Dict[str, bool]] = None


class PatientProfileUpdate(BaseModel):
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    height_cm: Optional[float] = Field(None, ge=30, le=260)
    weight_kg: Optional[float] = Field(None, ge=1, le=450)
    known_allergies: List[str] = Field(default_factory=list)
    existing_conditions: List[str] = Field(default_factory=list)
    current_medications: List[str] = Field(default_factory=list)
    family_medical_history: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None


class SymptomSubmitRequest(BaseModel):
    main_symptom: str = Field(..., min_length=2, max_length=160)
    additional_symptoms: List[str] = Field(default_factory=list)
    duration: str = Field(..., min_length=1, max_length=80)
    severity: str = Field(..., pattern="^(mild|moderate|severe|critical)$")
    frequency: Optional[str] = "constant"
    body_location: Optional[str] = None
    onset_date: Optional[date] = None
    relevant_medical_history: Optional[str] = None
    existing_medications: List[str] = Field(default_factory=list)
    additional_notes: Optional[str] = None
    run_ai_assessment: bool = True


class AIAssessmentRequest(BaseModel):
    symptom_record_id: Optional[int] = None
    main_symptom: Optional[str] = None
    additional_symptoms: List[str] = Field(default_factory=list)
    duration: Optional[str] = "2 days"
    severity: Optional[str] = "moderate"
    medical_history_notes: Optional[str] = None


class AIChatFollowUpRequest(BaseModel):
    assessment_id: int
    message: str = Field(..., min_length=1, max_length=2000)


class AppointmentCreateRequest(BaseModel):
    doctor_id: int
    scheduled_at: datetime
    consultation_type: str = Field("online", pattern="^(online|in_person)$")
    symptom_record_id: Optional[int] = None
    ai_assessment_id: Optional[int] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    share_ai_with_doctor: bool = True


class AppointmentUpdateRequest(BaseModel):
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = Field(None, pattern="^(scheduled|rescheduled|completed|cancelled)$")
    consultation_type: Optional[str] = Field(None, pattern="^(online|in_person)$")
    notes: Optional[str] = None


class DoctorProfileUpdate(BaseModel):
    qualification: Optional[str] = None
    medical_speciality: Optional[str] = None
    years_of_experience: Optional[int] = Field(None, ge=0, le=80)
    hospital_name: Optional[str] = None
    contact_info: Optional[str] = None
    availability_schedule: Optional[Dict[str, Any]] = None
    bio: Optional[str] = None
    profile_photo_url: Optional[str] = None


class DoctorAssessmentSubmitRequest(BaseModel):
    consultation_id: int
    clinical_observations: str = Field(..., min_length=3)
    symptoms_identified: List[str] = Field(default_factory=list)
    clinical_assessment: str = Field(..., min_length=3)
    confirmed_diagnosis: str = Field(..., min_length=2)
    differential_diagnoses: List[str] = Field(default_factory=list)
    recommended_investigations: List[str] = Field(default_factory=list)
    risk_classification: str = Field(..., pattern="^(low|moderate|high|urgent)$")
    treatment_plan: Optional[str] = None
    prescription: Optional[str] = None
    additional_notes: Optional[str] = None
    ai_suggestion_reviews: List[Dict[str, Any]] = Field(default_factory=list)
    disagreement_notes: Optional[str] = None


class AdminUserCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(patient|doctor|researcher|admin)$")
    status: str = Field("active", pattern="^(active|suspended|pending)$")


class AdminUserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[str] = Field(None, pattern="^(patient|doctor|researcher|admin)$")
    status: Optional[str] = Field(None, pattern="^(active|suspended|pending|deleted)$")


class DoctorVerificationAction(BaseModel):
    decision: str = Field(..., pattern="^(verified|rejected)$")
    review_notes: Optional[str] = None


class ResearchDatasetCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    source_type: str = "sample_benchmark"
    ai_model_version: str = "clinical-nlp-sklearn-v2.1"
    is_validated: bool = False
    records_payload: List[Dict[str, Any]] = Field(default_factory=list)


class ResearchProjectCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=240)
    objective: str = Field(..., min_length=5)
    dataset_id: Optional[int] = None
    findings_summary: Optional[str] = None
