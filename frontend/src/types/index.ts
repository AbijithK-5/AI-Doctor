export type UserRole = 'patient' | 'doctor' | 'researcher' | 'admin';

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string;
  role: UserRole;
  date_of_birth?: string;
  gender?: string;
  status: string;
  consent_accepted: boolean;
  notification_preferences?: Record<string, boolean>;
  privacy_settings?: Record<string, boolean>;
  created_at?: string;
}

export interface PossibleCondition {
  condition_name: string;
  icd_code?: string;
  speciality?: string;
  relative_likelihood_score: number;
  is_calibrated: boolean;
  calibration_note?: string;
  rank_order: number;
  matching_symptoms: string[];
  explanation: string;
}

export interface ExplainabilityFactor {
  feature: string;
  category: string;
  importance_weight: number;
  direction: string;
  rationale: string;
}

export interface AIAssessment {
  id: number;
  patient_id: number;
  symptom_record_id?: number;
  model_name: string;
  model_version: string;
  is_demo_mode: boolean;
  primary_summary: string;
  possible_conditions: PossibleCondition[];
  supporting_symptoms: string[];
  missing_information: string[];
  suggested_investigations: string[];
  risk_classification: 'low' | 'moderate' | 'high' | 'urgent';
  follow_up_questions: string[];
  general_health_education?: string;
  ai_recommendations: string[];
  explainability_factors: ExplainabilityFactor[];
  chat_history: { sender: 'ai' | 'patient'; message: string; timestamp: string }[];
  disclaimer_text: string;
  created_at: string;
}

export interface ComparisonRecord {
  id: number;
  consultation_id: number;
  patient_id: number;
  patient_name: string;
  patient_age?: number;
  patient_gender?: string;
  doctor_name: string;
  doctor_speciality: string;
  agreement_status: 'agree' | 'partial_agree' | 'disagree';
  agreement_score: number;
  matching_conditions: string[];
  different_conditions: string[];
  shared_symptoms: string[];
  missing_symptoms: string[];
  similar_investigations: string[];
  different_investigations: string[];
  areas_of_agreement: string[];
  areas_of_disagreement: string[];
  risk_comparison: {
    ai_risk: string;
    doctor_risk: string;
    risk_match: boolean;
    variance_note: string;
  };
  treatment_comparison: string;
  authoritative_statement: string;
  compared_at: string;
  ai_assessment: AIAssessment;
  doctor_assessment: {
    id: number;
    clinical_observations: string;
    symptoms_identified: string[];
    clinical_assessment: string;
    confirmed_diagnosis: string;
    differential_diagnoses: string[];
    recommended_investigations: string[];
    risk_classification: string;
    treatment_plan?: string;
    prescription?: string;
    additional_notes?: string;
    ai_suggestion_reviews?: any[];
    disagreement_notes?: string;
  };
}
