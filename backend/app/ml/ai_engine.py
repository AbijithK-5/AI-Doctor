"""
Clinical Decision-Support ML & Medical NLP Engine (Demo / Educational Mode).
Uses Scikit-learn TF-IDF + LogisticRegression and structured clinical feature weighting
to generate transparent, explainable decision-support assessments.
"""

from typing import Any, Dict, List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression


DISCLAIMER_TEXT = (
    "IMPORTANT: AI results are educational decision-support information only, "
    "not medical diagnoses, prescriptions, or treatment instructions. "
    "Always consult a licensed human physician for clinical evaluation."
)

RED_FLAG_SYMPTOMS = {
    "chest pain",
    "crushing chest pain",
    "shortness of breath",
    "difficulty breathing",
    "sudden weakness",
    "facial droop",
    "slurred speech",
    "severe sudden headache",
    "coughing up blood",
    "loss of consciousness",
    "throat swelling",
    "anaphylaxis",
    "suicidal thoughts",
    "high fever with stiff neck",
}

CLINICAL_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "condition": "Community-Acquired Pneumonia",
        "icd": "J18.9",
        "speciality": "Pulmonology",
        "base_risk": "high",
        "keywords": "cough fever productive sputum shortness of breath chest discomfort chills fatigue crackles",
        "symptoms": ["cough", "fever", "shortness of breath", "chills", "fatigue", "chest discomfort", "sputum"],
        "investigations": ["Chest X-Ray (PA/Lateral)", "Complete Blood Count (CBC)", "CRP / Procalcitonin", "Pulse Oximetry"],
        "missing_info": ["Resting oxygen saturation (SpO2)", "Lung auscultation findings", "Smoking history & vaccination status"],
        "follow_up": [
            "Is your cough producing colored or blood-tinged phlegm?",
            "Have you noticed rapid breathing or breathlessness while resting?",
            "What is your highest measured body temperature?",
        ],
        "education": "Lower respiratory tract infections involve lung parenchyma inflammation and require timely physical auscultation and imaging by a physician.",
        "recommendations": [
            "Schedule prompt in-person or urgent clinician evaluation for lung auscultation.",
            "Monitor temperature and breathing effort; seek emergency care if breathing worsens.",
            "Maintain hydration and avoid self-starting antibiotics without a doctor's prescription.",
        ],
    },
    {
        "condition": "Acute Viral Upper Respiratory Infection",
        "icd": "J06.9",
        "speciality": "General Medicine",
        "base_risk": "low",
        "keywords": "runny nose sore throat mild cough nasal congestion sneezing low grade fever headache fatigue",
        "symptoms": ["sore throat", "runny nose", "nasal congestion", "cough", "sneezing", "headache", "fatigue"],
        "investigations": ["Rapid Viral Antigen / PCR Swab (if indicated)", "Throat examination"],
        "missing_info": ["Exact temperature readings", "Sick contacts exposure", "Tonsillar exudate presence"],
        "follow_up": [
            "Did symptoms start gradually over 1–2 days?",
            "Are you experiencing sinus pressure or ear pain?",
        ],
        "education": "Viral upper respiratory infections are commonly self-limiting, though persistent fever or worsening breathlessness warrants physician reassessment.",
        "recommendations": [
            "Rest, stay well hydrated, and monitor symptom progression over 48–72 hours.",
            "Consult a primary care physician if fever persists beyond 3 days or breathing becomes difficult.",
        ],
    },
    {
        "condition": "Acute Coronary Syndrome / Angina Evaluation",
        "icd": "I20.9",
        "speciality": "Cardiology",
        "base_risk": "urgent",
        "keywords": "chest pain chest tightness radiating arm jaw sweating diaphoresis shortness of breath nausea dizziness palpitations",
        "symptoms": ["chest pain", "chest tightness", "shortness of breath", "sweating", "dizziness", "palpitations", "nausea"],
        "investigations": ["12-Lead ECG (Immediate)", "Serial High-Sensitivity Troponin", "Chest X-Ray", "Lipid Profile & BMP"],
        "missing_info": ["Blood pressure & heart rate", "Pain radiation to arm/jaw/back", "Cardiovascular risk factors (hypertension, diabetes)"],
        "follow_up": [
            "Does the chest discomfort worsen with exertion or radiate to your left arm, neck, or jaw?",
            "Are you experiencing cold sweats or lightheadedness right now?",
        ],
        "education": "Chest pain accompanied by sweating, nausea, or breathlessness requires immediate emergency medical evaluation to rule out acute cardiac ischemia.",
        "recommendations": [
            "URGENT: Seek immediate emergency medical evaluation (call emergency services) if chest pain is active or worsening.",
            "Do not drive yourself to the hospital if experiencing severe chest tightness or dizziness.",
        ],
    },
    {
        "condition": "Hypertensive Urgency / Essential Hypertension",
        "icd": "I10",
        "speciality": "Cardiology",
        "base_risk": "moderate",
        "keywords": "headache dizziness blurred vision high blood pressure palpitations neck stiffness chest discomfort",
        "symptoms": ["headache", "dizziness", "blurred vision", "palpitations", "fatigue"],
        "investigations": ["Repeated Resting Blood Pressure Log", "Basic Metabolic Panel (Renal Function)", "12-Lead ECG", "Urinalysis"],
        "missing_info": ["Home blood pressure cuff readings", "Medication adherence history", "Visual changes onset"],
        "follow_up": [
            "Have you measured your blood pressure recently, and what were the systolic/diastolic values?",
            "Have you missed any prescribed antihypertensive doses?",
        ],
        "education": "Sustained elevated blood pressure increases vascular strain; accurate cuff measurements and physician review guide safe management.",
        "recommendations": [
            "Record resting blood pressure twice daily and share the log with your doctor.",
            "Seek urgent care if blood pressure exceeds 180/120 mmHg with headache, chest pain, or vision changes.",
        ],
    },
    {
        "condition": "Migraine / Vascular Headache",
        "icd": "G43.9",
        "speciality": "Neurology",
        "base_risk": "moderate",
        "keywords": "throbbing headache unilateral nausea photophobia light sensitivity aura blurred vision dizziness",
        "symptoms": ["headache", "nausea", "light sensitivity", "blurred vision", "dizziness"],
        "investigations": ["Neurological Examination", "Brain MRI/CT (only if red flags present)"],
        "missing_info": ["Presence of visual aura", "Family history of migraines", "Sudden 'thunderclap' onset check"],
        "follow_up": [
            "Is the headache pulsating on one side of the head and worsened by light or sound?",
            "Did the headache come on gradually or instantaneously at peak intensity?",
        ],
        "education": "Migraines are recurrent neurovascular headaches often accompanied by sensory sensitivity; sudden severe onset requires urgent exclusion of vascular events.",
        "recommendations": [
            "Keep a headache diary noting triggers, duration, and associated aura.",
            "Consult a physician for tailored preventive or acute headache evaluation.",
        ],
    },
    {
        "condition": "Gastroesophageal Reflux / Acute Gastritis",
        "icd": "K21.9",
        "speciality": "Gastroenterology",
        "base_risk": "low",
        "keywords": "heartburn abdominal pain epigastric burning nausea bloating indigestion acid reflux loss of appetite",
        "symptoms": ["abdominal pain", "heartburn", "nausea", "bloating", "loss of appetite"],
        "investigations": ["H. pylori Breath/Stool Test", "Complete Blood Count", "Upper GI Endoscopy (if alarm symptoms)"],
        "missing_info": ["NSAID/painkiller usage", "Relation of pain to meals", "Presence of black stools or weight loss"],
        "follow_up": [
            "Does the upper abdominal discomfort worsen after meals or when lying flat?",
            "Have you recently used NSAID pain relievers such as ibuprofen?",
        ],
        "education": "Upper gastrointestinal irritation often presents with burning epigastric discomfort, though overlapping cardiac causes should be excluded when risk factors exist.",
        "recommendations": [
            "Avoid trigger foods, late-night meals, and unnecessary NSAIDs until evaluated by a clinician.",
            "Discuss targeted H. pylori testing or acid-suppression evaluation with your doctor.",
        ],
    },
    {
        "condition": "Acute Gastroenteritis",
        "icd": "A09",
        "speciality": "Gastroenterology",
        "base_risk": "moderate",
        "keywords": "diarrhea vomiting abdominal cramps nausea fever dehydration loss of appetite",
        "symptoms": ["diarrhea", "vomiting", "abdominal pain", "nausea", "fever", "fatigue"],
        "investigations": ["Serum Electrolytes & Renal Panel", "Stool Culture / PCR (if persistent or bloody)"],
        "missing_info": ["Fluid intake & urine output", "Recent travel or suspect food exposure", "Presence of blood in stool"],
        "follow_up": [
            "Are you able to keep oral fluids down without vomiting?",
            "Have you noticed dark urine or dizziness on standing?",
        ],
        "education": "Gastroenteritis commonly causes transient GI fluid loss; maintaining oral hydration and watching for dehydration signs is critical.",
        "recommendations": [
            "Prioritize small, frequent sips of oral rehydration solution.",
            "Seek medical care promptly if unable to retain fluids, or if high fever or bloody stools develop.",
        ],
    },
    {
        "condition": "Type 2 Diabetes Mellitus / Hyperglycemia Screen",
        "icd": "E11.9",
        "speciality": "Endocrinology",
        "base_risk": "moderate",
        "keywords": "excessive thirst frequent urination fatigue blurred vision unexplained weight loss slow healing numbness",
        "symptoms": ["excessive thirst", "frequent urination", "fatigue", "blurred vision", "numbness"],
        "investigations": ["HbA1c (Glycated Hemoglobin)", "Fasting Plasma Glucose", "Comprehensive Metabolic Panel", "Urinalysis"],
        "missing_info": ["Fasting blood glucose values", "Family history of diabetes", "Recent weight changes"],
        "follow_up": [
            "Have you noticed increased nighttime urination alongside persistent thirst?",
            "Have you had a fasting blood sugar or HbA1c test in the past year?",
        ],
        "education": "Metabolic hyperglycemia develops gradually and requires laboratory HbA1c and fasting glucose confirmation by a healthcare provider.",
        "recommendations": [
            "Request fasting glucose and HbA1c blood tests through your physician.",
            "Seek urgent care if experiencing rapid breathing, fruity breath odor, or severe vomiting.",
        ],
    },
    {
        "condition": "Bronchial Asthma Exacerbation",
        "icd": "J45.901",
        "speciality": "Pulmonology",
        "base_risk": "high",
        "keywords": "wheezing shortness of breath chest tightness dry cough night cough triggers allergy",
        "symptoms": ["wheezing", "shortness of breath", "chest tightness", "cough"],
        "investigations": ["Peak Expiratory Flow (PEF)", "Spirometry with Bronchodilator", "Pulse Oximetry"],
        "missing_info": ["Prior asthma diagnosis & rescue inhaler response", "Allergen or cold air triggers"],
        "follow_up": [
            "Is the wheezing worse at night, early morning, or after exercise?",
            "Do you already use an inhaler, and has its relief shortened recently?",
        ],
        "education": "Airway hyperresponsiveness causes reversible bronchoconstriction; objective spirometry and clinician review establish safe controller plans.",
        "recommendations": [
            "Follow your physician's written asthma action plan if previously diagnosed, and schedule clinical review.",
            "Seek emergency care if unable to speak in full sentences due to breathlessness.",
        ],
    },
    {
        "condition": "Urinary Tract Infection (UTI)",
        "icd": "N39.0",
        "speciality": "Urology / Internal Medicine",
        "base_risk": "moderate",
        "keywords": "burning urination dysuria frequent urination pelvic pain cloudy urine urgency flank pain fever",
        "symptoms": ["burning urination", "frequent urination", "abdominal pain", "fever"],
        "investigations": ["Urinalysis with Microscopy", "Urine Culture & Sensitivity", "Renal Function (if fever/flank pain)"],
        "missing_info": ["Presence of back/flank pain or rigors", "Pregnancy status where applicable"],
        "follow_up": [
            "Do you have lower back or side (flank) pain, fever, or chills?",
            "Has urination become painful or noticeably cloudy?",
        ],
        "education": "Lower urinary infections cause dysuria and frequency, while fever or flank pain may suggest upper tract involvement needing prompt physician care.",
        "recommendations": [
            "Arrange urine microscopy and culture testing with a clinician before starting targeted therapy.",
            "Seek prompt care if fever, chills, or flank pain develop.",
        ],
    },
    {
        "condition": "Generalized Anxiety / Stress-Related Autonomic Response",
        "icd": "F41.1",
        "speciality": "Psychiatry / General Medicine",
        "base_risk": "low",
        "keywords": "palpitations anxiety chest tightness insomnia fatigue dizziness sweating restlessness",
        "symptoms": ["palpitations", "fatigue", "dizziness", "chest tightness", "sweating", "insomnia"],
        "investigations": ["Thyroid Function Panel (TSH)", "12-Lead ECG (to rule out arrhythmia)", "CBC & Iron Studies"],
        "missing_info": ["Sleep duration & stressors", "Caffeine or stimulant intake"],
        "follow_up": [
            "Do these episodes occur during periods of acute stress or while resting quietly?",
            "How much caffeine or stimulant medication do you consume daily?",
        ],
        "education": "Autonomic arousal can mimic cardiopulmonary symptoms; physicians typically exclude thyroid or cardiac rhythm causes before attributing symptoms to stress.",
        "recommendations": [
            "Discuss both physical rule-out screening (TSH, ECG) and stress-support resources with your clinician.",
        ],
    },
    {
        "condition": "Musculoskeletal Strain / Inflammatory Myalgia",
        "icd": "M79.1",
        "speciality": "Orthopedics / General Medicine",
        "base_risk": "low",
        "keywords": "joint pain back pain muscle ache stiffness swelling limited movement localized tenderness",
        "symptoms": ["joint pain", "back pain", "muscle ache", "swelling", "fatigue"],
        "investigations": ["Focused Musculoskeletal Exam", "ESR / CRP (if inflammatory signs)", "Targeted X-Ray (if trauma)"],
        "missing_info": ["Recent physical injury or heavy lifting", "Morning stiffness duration"],
        "follow_up": [
            "Did the pain begin after lifting, exercise, or an injury?",
            "Is there visible joint redness, warmth, or morning stiffness lasting over 30 minutes?",
        ],
        "education": "Localized musculoskeletal pain often relates to mechanical strain, though persistent swelling or systemic fever warrants clinical evaluation.",
        "recommendations": [
            "Rest the affected area gently and arrange a primary care or orthopedic assessment if pain persists.",
        ],
    },
]


class ClinicalDecisionSupportEngine:
    """Scikit-learn TF-IDF + LogisticRegression model trained on the curated symptom corpus."""

    def __init__(self):
        self.model_name = "Clinical-NLP-Sklearn-TFIDF-LR"
        self.model_version = "clinical-nlp-sklearn-v2.1"
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), lowercase=True)
        self.classifier = LogisticRegression(max_iter=1000, C=2.0)
        self._train_model()

    def _train_model(self):
        corpus = []
        labels = []
        for idx, item in enumerate(CLINICAL_KNOWLEDGE_BASE):
            # Create multiple synthetic training variations per condition for stable probability ranking
            base_kw = item["keywords"]
            syms = item["symptoms"]
            corpus.append(base_kw)
            labels.append(idx)
            corpus.append(" ".join(syms))
            labels.append(idx)
            if len(syms) >= 3:
                corpus.append(" ".join(syms[:3]) + " " + item["speciality"].lower())
                labels.append(idx)
                corpus.append(" ".join(syms[-3:]) + " " + base_kw)
                labels.append(idx)

        X = self.vectorizer.fit_transform(corpus)
        self.classifier.fit(X, labels)

    def assess(
        self,
        main_symptom: str,
        additional_symptoms: List[str],
        duration: str,
        severity: str,
        medical_history: Optional[str] = None,
        existing_medications: Optional[List[str]] = None,
        patient_profile: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        all_symptoms = [main_symptom.strip()] + [s.strip() for s in additional_symptoms if s.strip()]
        normalized_symptoms = [s.lower() for s in all_symptoms]

        # Check emergency red flags
        emergency_flagged = False
        red_flags_detected = []
        for s in normalized_symptoms:
            for rf in RED_FLAG_SYMPTOMS:
                if rf in s or s in rf:
                    emergency_flagged = True
                    red_flags_detected.append(s)
        if severity == "critical":
            emergency_flagged = True

        query_text = " ".join(normalized_symptoms)
        if medical_history:
            query_text += " " + medical_history.lower()

        X_q = self.vectorizer.transform([query_text])
        probs = self.classifier.predict_proba(X_q)[0]

        # Combine ML probability with explicit symptom overlap weighting
        scored_conditions = []
        for idx, item in enumerate(CLINICAL_KNOWLEDGE_BASE):
            ml_prob = float(probs[idx])
            kb_syms = set(item["symptoms"])
            overlap = []
            for user_s in normalized_symptoms:
                for kb_s in kb_syms:
                    if kb_s in user_s or user_s in kb_s:
                        overlap.append(kb_s)
            unique_overlap = sorted(set(overlap))
            overlap_ratio = len(unique_overlap) / max(len(kb_syms), 1)
            combined_score = round(min(0.95, 0.45 * ml_prob + 0.55 * overlap_ratio), 4)
            scored_conditions.append((combined_score, idx, unique_overlap))

        scored_conditions.sort(key=lambda x: x[0], reverse=True)
        top_matches = scored_conditions[:3]

        possible_conditions = []
        supporting_symptoms = []
        suggested_investigations = []
        missing_information = []
        follow_up_questions = []
        ai_recommendations = []
        education_notes = []

        for rank, (score, idx, overlap) in enumerate(top_matches, start=1):
            kb = CLINICAL_KNOWLEDGE_BASE[idx]
            possible_conditions.append({
                "condition_name": kb["condition"],
                "icd_code": kb["icd"],
                "speciality": kb["speciality"],
                "relative_likelihood_score": round(score * 100, 1),
                "is_calibrated": False,
                "calibration_note": "Relative TF-IDF/symptom-overlap ranking (demo corpus — not clinically calibrated probability).",
                "rank_order": rank,
                "matching_symptoms": overlap if overlap else [main_symptom],
                "explanation": kb["education"],
            })
            supporting_symptoms.extend(overlap)
            suggested_investigations.extend(kb["investigations"])
            missing_information.extend(kb["missing_info"])
            follow_up_questions.extend(kb["follow_up"])
            ai_recommendations.extend(kb["recommendations"])
            if rank == 1:
                education_notes.append(kb["education"])

        # Deduplicate lists preserving order
        def dedup(seq):
            seen = set()
            out = []
            for item in seq:
                if item not in seen:
                    seen.add(item)
                    out.append(item)
            return out

        supporting_symptoms = dedup(supporting_symptoms) or all_symptoms
        suggested_investigations = dedup(suggested_investigations)[:6]
        missing_information = dedup(missing_information)[:5]
        follow_up_questions = dedup(follow_up_questions)[:4]
        ai_recommendations = dedup(ai_recommendations)[:5]

        # Determine risk classification
        top_kb = CLINICAL_KNOWLEDGE_BASE[top_matches[0][1]]
        risk = top_kb["base_risk"]
        if emergency_flagged or severity == "critical":
            risk = "urgent"
        elif severity == "severe" and risk == "low":
            risk = "moderate"

        # Explainable AI feature importance vector (TF-IDF token weights + severity/history multipliers)
        feature_names = self.vectorizer.get_feature_names_out()
        q_vec = X_q.toarray()[0]
        top_coef = self.classifier.coef_[top_matches[0][1]]
        explainability_factors = []
        for s in all_symptoms:
            s_lower = s.lower()
            weight = 0.25
            for token in s_lower.split():
                matches = np.where(feature_names == token)[0]
                if len(matches) > 0:
                    idx_f = matches[0]
                    weight += max(0.0, float(q_vec[idx_f] * top_coef[idx_f]))
            if s_lower in RED_FLAG_SYMPTOMS:
                weight += 0.35
            explainability_factors.append({
                "feature": s,
                "category": "Symptom Input",
                "importance_weight": round(min(weight, 0.99), 3),
                "direction": "increases_relevance",
                "rationale": f"Matched symptom token(s) in {top_kb['condition']} feature space.",
            })

        if medical_history:
            explainability_factors.append({
                "feature": f"History: {medical_history[:60]}",
                "category": "Medical Context",
                "importance_weight": 0.28,
                "direction": "contextual_modifier",
                "rationale": "Existing history modifies baseline clinical risk stratification.",
            })

        if existing_medications:
            explainability_factors.append({
                "feature": f"Medications ({len(existing_medications)})",
                "category": "Medication Context",
                "importance_weight": 0.18,
                "direction": "contextual_modifier",
                "rationale": "Current medications checked for symptom overlap or interaction context.",
            })

        explainability_factors.sort(key=lambda x: x["importance_weight"], reverse=True)

        summary = (
            f"[DEMO CLINICAL DECISION-SUPPORT] Based on primary symptom '{main_symptom}' "
            f"(severity: {severity}, duration: {duration}) and {len(additional_symptoms)} additional symptom(s), "
            f"top informational considerations include {possible_conditions[0]['condition_name']} "
            f"and {possible_conditions[1]['condition_name']}. "
            f"Risk triage level: {risk.upper()}."
        )
        if emergency_flagged:
            summary = (
                "EMERGENCY WARNING: Potential red-flag symptom pattern detected ("
                + ", ".join(set(red_flags_detected) or [main_symptom])
                + "). Seek immediate emergency medical services (911 / local ER) rather than waiting for an online review. "
                + summary
            )

        return {
            "model_name": self.model_name,
            "model_version": self.model_version,
            "is_demo_mode": True,
            "emergency_flagged": emergency_flagged,
            "primary_summary": summary,
            "possible_conditions": possible_conditions,
            "supporting_symptoms": supporting_symptoms,
            "missing_information": missing_information,
            "suggested_investigations": suggested_investigations,
            "risk_classification": risk,
            "follow_up_questions": follow_up_questions,
            "general_health_education": " ".join(education_notes),
            "ai_recommendations": ai_recommendations,
            "explainability_factors": explainability_factors,
            "disclaimer_text": DISCLAIMER_TEXT,
        }

    def generate_followup_reply(self, assessment_data: Dict[str, Any], user_message: str) -> str:
        msg_lower = user_message.lower()
        top_cond = (
            assessment_data.get("possible_conditions", [{}])[0].get("condition_name", "the top listed condition")
        )
        investigations = ", ".join(assessment_data.get("suggested_investigations", [])[:3]) or "a clinical physical exam"

        for rf in RED_FLAG_SYMPTOMS:
            if rf in msg_lower:
                return (
                    f"⚠️ You mentioned '{rf}', which can be an urgent warning sign. "
                    "Please contact emergency medical services or visit the nearest emergency department immediately. "
                    "This AI assistant cannot evaluate emergencies or replace urgent human care."
                )

        if "test" in msg_lower or "investigation" in msg_lower or "lab" in msg_lower:
            return (
                f"For educational context around {top_cond}, clinicians commonly consider: {investigations}. "
                "Your human doctor will determine which tests are truly necessary after examining you."
            )
        if "medicine" in msg_lower or "drug" in msg_lower or "prescription" in msg_lower or "dose" in msg_lower:
            return (
                "I cannot prescribe medications or recommend specific dosages. "
                "Please book a consultation with a registered human doctor so they can evaluate your full profile "
                "and issue any safe, clinically appropriate prescription."
            )
        if "why" in msg_lower or "explain" in msg_lower:
            factors = assessment_data.get("explainability_factors", [])
            factor_str = ", ".join(f"{f['feature']} (weight {f['importance_weight']})" for f in factors[:3])
            return (
                f"In this decision-support summary, the strongest contributing inputs were: {factor_str}. "
                "Remember that statistical feature weights reflect pattern similarity in our demo NLP corpus, not clinical proof."
            )

        return (
            f"Thank you for sharing that additional detail. Considering your earlier profile and '{top_cond}' "
            f"as an informational possibility, I've noted this context for your human doctor review. "
            f"Suggested next step: book or open a Human Doctor Consultation so a licensed physician can compare their "
            f"clinical assessment side-by-side with this decision-support summary."
        )


ai_engine = ClinicalDecisionSupportEngine()
