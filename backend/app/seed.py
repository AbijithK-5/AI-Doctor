"""
Seeds realistic demo records across all modules when the database is empty.
"""

from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from sqlalchemy.orm import Session

from .config import settings
from .ml.ai_engine import DISCLAIMER_TEXT, ai_engine
from .models import (
    AIAssessment,
    AIPredictionRecord,
    Appointment,
    AuditLog,
    ComparisonResult,
    Consultation,
    DoctorAssessment,
    DoctorProfile,
    DoctorVerification,
    HospitalProfile,
    MedicalReport,
    Notification,
    PatientProfile,
    PatientSymptomRecord,
    ResearchDataset,
    ResearchProject,
    ResearcherProfile,
    Symptom,
    User,
)
from .security import hash_password
from .services.comparison_engine import compute_comparison


SYMPTOMS_CATALOG = [
    ("Chest Pain", "Cardiopulmonary", "Cardiovascular", True, "Tightness, pressure, or sharp pain in the chest"),
    ("Shortness of Breath", "Cardiopulmonary", "Respiratory", True, "Difficulty catching breath or dyspnea"),
    ("Cough", "Respiratory", "Respiratory", False, "Dry or productive cough"),
    ("Fever", "Systemic", "Immune", False, "Elevated body temperature above 38°C / 100.4°F"),
    ("Headache", "Neurological", "Nervous System", False, "Throbbing, tension, or localized cranial pain"),
    ("Dizziness", "Neurological", "Vestibular / Cardiovascular", False, "Lightheadedness or vertigo"),
    ("Sore Throat", "ENT", "Upper Respiratory", False, "Pharyngeal irritation or pain on swallowing"),
    ("Fatigue", "Systemic", "General", False, "Persistent tiredness or lack of energy"),
    ("Nausea", "Gastrointestinal", "Digestive", False, "Queasiness or urge to vomit"),
    ("Abdominal Pain", "Gastrointestinal", "Digestive", False, "Cramping, burning, or localized abdominal discomfort"),
    ("Heartburn", "Gastrointestinal", "Digestive", False, "Retrosternal burning sensation after meals"),
    ("Palpitations", "Cardiopulmonary", "Cardiovascular", False, "Awareness of rapid, fluttering, or pounding heartbeat"),
    ("Wheezing", "Respiratory", "Respiratory", False, "High-pitched whistling sound during breathing"),
    ("Excessive Thirst", "Metabolic", "Endocrine", False, "Polydipsia / persistent thirst"),
    ("Frequent Urination", "Urological / Metabolic", "Renal / Endocrine", False, "Increased frequency of urination"),
    ("Burning Urination", "Urological", "Renal / Urinary", False, "Dysuria or discomfort during urination"),
    ("Joint Pain", "Musculoskeletal", "Musculoskeletal", False, "Aching, stiffness, or tenderness in joints"),
    ("Blurred Vision", "Sensory / Vascular", "Ocular / Neurological", False, "Reduced visual sharpness"),
    ("Chills", "Systemic", "Immune", False, "Shivering or cold sensation"),
    ("Photophobia", "Neurological", "Nervous System", False, "Abnormal sensitivity to light"),
]


def seed_database(db: Session):
    if db.query(User).first() is not None:
        return

    now = datetime.now(timezone.utc)

    # 1. Symptoms Catalog
    for name, cat, body_sys, red_flag, desc in SYMPTOMS_CATALOG:
        db.add(Symptom(name=name, category=cat, body_system=body_sys, is_red_flag=red_flag, description=desc))

    # 2. Hospital
    hospital = HospitalProfile(
        name="Metro Care Clinical Research Hospital",
        registration_code="HOSP-MC-2026",
        address="420 Medical Innovation Way",
        city="Boston",
        country="USA",
        contact_email="clinical@metrocare-demo.org",
        contact_phone="+1-555-0190",
        accreditation_status="verified",
    )
    db.add(hospital)
    db.flush()

    # 3. Demo Users (Patient, Doctors, Researcher, Admin)
    patient1 = User(
        full_name="Aarav Sharma",
        email="patient@demo.com",
        phone_number="+1-555-0101",
        password_hash=hash_password("Demo@123"),
        role="patient",
        date_of_birth=date(1992, 5, 14),
        gender="Male",
        status="active",
        consent_accepted=True,
        consent_accepted_at=now,
    )
    patient2 = User(
        full_name="Maya Lin",
        email="maya.patient@demo.com",
        phone_number="+1-555-0102",
        password_hash=hash_password("Demo@123"),
        role="patient",
        date_of_birth=date(1986, 9, 22),
        gender="Female",
        status="active",
        consent_accepted=True,
        consent_accepted_at=now,
    )
    doc1 = User(
        full_name="Dr. Elena Vance",
        email="doctor@demo.com",
        phone_number="+1-555-0201",
        password_hash=hash_password("Demo@123"),
        role="doctor",
        gender="Female",
        status="active",
        consent_accepted=True,
        consent_accepted_at=now,
    )
    doc2 = User(
        full_name="Dr. Marcus Sterling",
        email="marcus.doctor@demo.com",
        phone_number="+1-555-0202",
        password_hash=hash_password("Demo@123"),
        role="doctor",
        gender="Male",
        status="active",
        consent_accepted=True,
        consent_accepted_at=now,
    )
    doc3 = User(
        full_name="Dr. Priya Nair",
        email="priya.doctor@demo.com",
        phone_number="+1-555-0203",
        password_hash=hash_password("Demo@123"),
        role="doctor",
        gender="Female",
        status="active",
        consent_accepted=True,
        consent_accepted_at=now,
    )
    researcher = User(
        full_name="Dr. Liam O'Connor",
        email="researcher@demo.com",
        phone_number="+1-555-0301",
        password_hash=hash_password("Demo@123"),
        role="researcher",
        gender="Male",
        status="active",
        consent_accepted=True,
        consent_accepted_at=now,
    )
    admin = User(
        full_name="Sophia Carter (Admin)",
        email="admin@demo.com",
        phone_number="+1-555-0401",
        password_hash=hash_password("Demo@123"),
        role="admin",
        gender="Female",
        status="active",
        consent_accepted=True,
        consent_accepted_at=now,
    )
    db.add_all([patient1, patient2, doc1, doc2, doc3, researcher, admin])
    db.flush()

    # 4. Profiles
    db.add(
        PatientProfile(
            user_id=patient1.id,
            age=34,
            gender="Male",
            blood_group="O+",
            height_cm=176.0,
            weight_kg=74.5,
            known_allergies=["Penicillin", "Dust Mites"],
            existing_conditions=["Mild Seasonal Asthma"],
            current_medications=["Albuterol PRN"],
            family_medical_history="Father: Hypertension; Mother: Type 2 Diabetes",
            emergency_contact_name="Rohan Sharma",
            emergency_contact_phone="+1-555-0199",
            emergency_contact_relation="Brother",
        )
    )
    db.add(
        PatientProfile(
            user_id=patient2.id,
            age=40,
            gender="Female",
            blood_group="A+",
            height_cm=164.0,
            weight_kg=60.0,
            known_allergies=["Sulfa Drugs"],
            existing_conditions=["Migraine History"],
            current_medications=["Sumatriptan 50mg PRN"],
            family_medical_history="Mother: Migraine",
            emergency_contact_name="Daniel Lin",
            emergency_contact_phone="+1-555-0188",
            emergency_contact_relation="Spouse",
        )
    )

    dp1 = DoctorProfile(
        user_id=doc1.id,
        hospital_id=hospital.id,
        qualification="MBBS, MD (Internal Medicine & Pulmonology)",
        medical_speciality="Pulmonology & Internal Medicine",
        registration_number="NMC-88421-IN",
        years_of_experience=12,
        hospital_name=hospital.name,
        contact_info="elena.vance@metrocare-demo.org",
        availability_schedule={"days": ["Mon", "Tue", "Wed", "Thu", "Fri"], "hours": "09:00 - 17:00"},
        bio="Senior Pulmonologist specializing in respiratory diagnostics and clinical decision-support auditing.",
        verification_status="verified",
        rating=4.9,
    )
    dp2 = DoctorProfile(
        user_id=doc2.id,
        hospital_id=hospital.id,
        qualification="MD, FACC (Cardiology)",
        medical_speciality="Cardiology",
        registration_number="ABIM-44290-US",
        years_of_experience=15,
        hospital_name=hospital.name,
        contact_info="marcus.sterling@metrocare-demo.org",
        availability_schedule={"days": ["Mon", "Wed", "Fri"], "hours": "10:00 - 18:00"},
        bio="Interventional & Preventive Cardiologist focused on chest pain triage and hypertension management.",
        verification_status="verified",
        rating=4.85,
    )
    dp3 = DoctorProfile(
        user_id=doc3.id,
        hospital_id=hospital.id,
        qualification="MBBS, DM (Neurology)",
        medical_speciality="Neurology",
        registration_number="NMC-99104-IN",
        years_of_experience=8,
        hospital_name="City Neuro Care Center",
        contact_info="priya.nair@neurocare-demo.org",
        availability_schedule={"days": ["Tue", "Thu", "Sat"], "hours": "11:00 - 16:00"},
        bio="Neurologist evaluating headache syndromes and neurovascular risk stratification.",
        verification_status="pending",
        rating=4.75,
    )
    db.add_all([dp1, dp2, dp3])
    db.flush()

    db.add_all([
        DoctorVerification(doctor_profile_id=dp1.id, submitted_license_number=dp1.registration_number, issuing_authority="State Medical Board", status="approved", reviewed_by_admin_id=admin.id, reviewed_at=now),
        DoctorVerification(doctor_profile_id=dp2.id, submitted_license_number=dp2.registration_number, issuing_authority="ABIM", status="approved", reviewed_by_admin_id=admin.id, reviewed_at=now),
        DoctorVerification(doctor_profile_id=dp3.id, submitted_license_number=dp3.registration_number, issuing_authority="National Medical Commission", status="pending"),
    ])

    db.add(
        ResearcherProfile(
            user_id=researcher.id,
            institution="Harvard-MIT Clinical AI Lab (Demo)",
            department="Biomedical Informatics",
            research_focus="Human-AI Diagnostic Concordance & Explainability",
            orcid_id="0000-0002-1825-0097",
            ethics_clearance_id="IRB-2026-0412",
        )
    )

    # 5. Seed Case 1 (Agree / High Concordance: Pneumonia) & Case 2 (Disagreement: Heartburn vs Angina/GERD nuance)
    sym1 = PatientSymptomRecord(
        patient_id=patient1.id,
        main_symptom="Cough",
        additional_symptoms=["Fever", "Chills", "Fatigue", "Chest Discomfort"],
        duration="4 days",
        severity="moderate",
        frequency="persistent",
        body_location="Chest / Lower Respiratory",
        onset_date=date.today() - timedelta(days=4),
        relevant_medical_history="Mild Seasonal Asthma",
        existing_medications=["Albuterol PRN"],
        additional_notes="Productive cough worsening in evenings.",
        emergency_flagged=False,
    )
    sym2 = PatientSymptomRecord(
        patient_id=patient1.id,
        main_symptom="Heartburn",
        additional_symptoms=["Abdominal Pain", "Nausea"],
        duration="5 days",
        severity="moderate",
        frequency="after meals",
        body_location="Epigastric",
        onset_date=date.today() - timedelta(days=5),
        relevant_medical_history="Mild Seasonal Asthma",
        existing_medications=["Albuterol PRN"],
        additional_notes="Burning discomfort after dinner.",
        emergency_flagged=False,
    )
    sym3 = PatientSymptomRecord(
        patient_id=patient2.id,
        main_symptom="Headache",
        additional_symptoms=["Nausea", "Light Sensitivity", "Blurred Vision"],
        duration="2 days",
        severity="severe",
        frequency="intermittent",
        body_location="Right Temporal",
        onset_date=date.today() - timedelta(days=2),
        relevant_medical_history="Migraine History",
        existing_medications=["Sumatriptan 50mg PRN"],
        additional_notes="Throbbing pain worse with bright screens.",
        emergency_flagged=False,
    )
    db.add_all([sym1, sym2, sym3])
    db.flush()

    def _make_ai(sym_rec: PatientSymptomRecord, patient_u: User):
        res = ai_engine.assess(
            main_symptom=sym_rec.main_symptom,
            additional_symptoms=sym_rec.additional_symptoms,
            duration=sym_rec.duration,
            severity=sym_rec.severity,
            medical_history=sym_rec.relevant_medical_history,
            existing_medications=sym_rec.existing_medications,
        )
        aa = AIAssessment(
            patient_id=patient_u.id,
            symptom_record_id=sym_rec.id,
            model_name=res["model_name"],
            model_version=res["model_version"],
            is_demo_mode=True,
            primary_summary=res["primary_summary"],
            possible_conditions=res["possible_conditions"],
            supporting_symptoms=res["supporting_symptoms"],
            missing_information=res["missing_information"],
            suggested_investigations=res["suggested_investigations"],
            risk_classification=res["risk_classification"],
            follow_up_questions=res["follow_up_questions"],
            general_health_education=res["general_health_education"],
            ai_recommendations=res["ai_recommendations"],
            explainability_factors=res["explainability_factors"],
            chat_history=[{"sender": "ai", "message": res["primary_summary"], "timestamp": now.isoformat()}],
            disclaimer_text=DISCLAIMER_TEXT,
        )
        db.add(aa)
        db.flush()
        for c in res["possible_conditions"]:
            db.add(AIPredictionRecord(
                ai_assessment_id=aa.id,
                condition_name=c["condition_name"],
                icd_code=c["icd_code"],
                probability_score=c["relative_likelihood_score"] / 100.0,
                rank_order=c["rank_order"],
                supporting_features=c["matching_symptoms"],
                explanation=c["explanation"],
            ))
        return aa

    ai1 = _make_ai(sym1, patient1)
    ai2 = _make_ai(sym2, patient1)
    ai3 = _make_ai(sym3, patient2)

    # Appointments & Consultations
    appt1 = Appointment(
        patient_id=patient1.id, doctor_id=doc1.id, symptom_record_id=sym1.id, ai_assessment_id=ai1.id,
        scheduled_at=now - timedelta(days=2), consultation_type="online", status="completed",
        reason="Persistent cough and fever — requested comparison review",
    )
    appt2 = Appointment(
        patient_id=patient1.id, doctor_id=doc2.id, symptom_record_id=sym2.id, ai_assessment_id=ai2.id,
        scheduled_at=now - timedelta(days=1), consultation_type="online", status="completed",
        reason="Epigastric burning / rule out cardiac vs GI origin",
    )
    appt3 = Appointment(
        patient_id=patient1.id, doctor_id=doc1.id, symptom_record_id=sym1.id, ai_assessment_id=ai1.id,
        scheduled_at=now + timedelta(days=2), consultation_type="online", status="scheduled",
        reason="Follow-up respiratory check",
    )
    appt4 = Appointment(
        patient_id=patient2.id, doctor_id=doc1.id, symptom_record_id=sym3.id, ai_assessment_id=ai3.id,
        scheduled_at=now + timedelta(hours=18), consultation_type="online", status="scheduled",
        reason="Severe unilateral headache review",
    )
    db.add_all([appt1, appt2, appt3, appt4])
    db.flush()

    c1 = Consultation(appointment_id=appt1.id, patient_id=patient1.id, doctor_id=doc1.id, symptom_record_id=sym1.id, ai_assessment_id=ai1.id, status="completed", completed_at=now - timedelta(days=2))
    c2 = Consultation(appointment_id=appt2.id, patient_id=patient1.id, doctor_id=doc2.id, symptom_record_id=sym2.id, ai_assessment_id=ai2.id, status="completed", completed_at=now - timedelta(days=1))
    c3 = Consultation(appointment_id=appt4.id, patient_id=patient2.id, doctor_id=doc1.id, symptom_record_id=sym3.id, ai_assessment_id=ai3.id, status="pending_review")
    db.add_all([c1, c2, c3])
    db.flush()

    da1 = DoctorAssessment(
        consultation_id=c1.id, patient_id=patient1.id, doctor_id=doc1.id,
        clinical_observations="Inspiratory crackles heard in right lower lung field; SpO2 96% on room air; temp 38.4°C.",
        symptoms_identified=["cough", "fever", "chills", "fatigue", "chest discomfort"],
        clinical_assessment="Findings consistent with right lower lobe Community-Acquired Pneumonia, mild-to-moderate severity suitable for outpatient management.",
        confirmed_diagnosis="Community-Acquired Pneumonia",
        differential_diagnoses=["Acute Bronchitis", "Asthma Exacerbation"],
        recommended_investigations=["Chest X-Ray (PA/Lateral)", "Complete Blood Count (CBC)", "CRP / Procalcitonin"],
        risk_classification="high",
        treatment_plan="Outpatient macrolide therapy (avoiding Penicillin due to documented allergy), oral hydration, and 48-hour clinical follow-up.",
        prescription="Azithromycin 500mg Day 1 then 250mg Days 2-5 (Penicillin allergy noted)",
        additional_notes="Patient's penicillin allergy safely avoided; Chest X-ray ordered.",
        ai_suggestion_reviews=[{"condition": "Community-Acquired Pneumonia", "decision": "accepted", "note": "Aligned with right basal crackles."}],
        disagreement_notes="AI correctly flagged pneumonia, though physical auscultation and penicillin allergy verification were essential.",
    )
    da2 = DoctorAssessment(
        consultation_id=c2.id, patient_id=patient1.id, doctor_id=doc2.id,
        clinical_observations="Borderline blood pressure 148/92 mmHg; mild exertional component reported upon targeted questioning; ECG normal sinus rhythm.",
        symptoms_identified=["heartburn", "abdominal pain", "nausea", "exertional chest discomfort"],
        clinical_assessment="While GI reflux is possible, family history of hypertension and post-meal discomfort warrant excluding atypical angina before assuming benign gastritis.",
        confirmed_diagnosis="Atypical Angina Rule-Out / Essential Hypertension",
        differential_diagnoses=["Gastroesophageal Reflux Disease (GERD)"],
        recommended_investigations=["12-Lead ECG (Immediate)", "Lipid Profile & BMP", "H. pylori Breath/Stool Test"],
        risk_classification="high",
        treatment_plan="Hold heavy exertion pending cardiac stress screen; initiate blood pressure log and cautious gastroprotection.",
        prescription="Omeprazole 20mg OD + Cardiology Exercise Stress Evaluation",
        additional_notes="Upgraded risk classification from AI 'low' to clinician 'high' due to family CV history.",
        ai_suggestion_reviews=[{"condition": "Gastroesophageal Reflux / Acute Gastritis", "decision": "modified", "note": "Ranked too low risk given family cardiac history."}],
        disagreement_notes="AI rated risk as LOW based purely on GI symptom text; physician elevated to HIGH to rule out atypical cardiac ischemia.",
    )
    db.add_all([da1, da2])
    db.flush()

    cmp1_data = compute_comparison(ai1, da1)
    cmp2_data = compute_comparison(ai2, da2)
    db.add(ComparisonResult(patient_id=patient1.id, consultation_id=c1.id, ai_assessment_id=ai1.id, doctor_assessment_id=da1.id, **cmp1_data))
    db.add(ComparisonResult(patient_id=patient1.id, consultation_id=c2.id, ai_assessment_id=ai2.id, doctor_assessment_id=da2.id, **cmp2_data))

    # 6. Sample Medical Report
    sample_dir = Path(settings.UPLOAD_DIR) / f"patient_{patient1.id}"
    sample_dir.mkdir(parents=True, exist_ok=True)
    sample_file = sample_dir / "cbc_lab_panel_demo.txt"
    sample_file.write_text("DEMO LABORATORY REPORT\nWBC: 12.4 x10^9/L (Mild Leukocytosis)\nCRP: 34 mg/L\nSpO2: 96%\n", encoding="utf-8")
    db.add(
        MedicalReport(
            patient_id=patient1.id,
            consultation_id=c1.id,
            title="Complete Blood Count & CRP Panel (Demo)",
            category="laboratory",
            file_name="cbc_lab_panel_demo.txt",
            stored_path=str(sample_file),
            mime_type="text/plain",
            file_size_bytes=sample_file.stat().st_size,
            report_date=date.today() - timedelta(days=2),
            notes="Elevated WBC and CRP supporting lower respiratory infection workup.",
        )
    )

    # 7. Sample Validated Research Dataset (Clearly Labelled Sample Benchmark Data)
    benchmark_records = [
        {"case_id": "BM-001", "case_date": "2026-07-12", "ai_prediction": "Community-Acquired Pneumonia", "doctor_diagnosis": "Community-Acquired Pneumonia", "outcome": "match", "actual_positive": True, "predicted_positive": True, "model_version": "clinical-nlp-sklearn-v2.1"},
        {"case_id": "BM-002", "case_date": "2026-07-24", "ai_prediction": "Acute Viral Upper Respiratory Infection", "doctor_diagnosis": "Acute Viral Upper Respiratory Infection", "outcome": "match", "actual_positive": False, "predicted_positive": False, "model_version": "clinical-nlp-sklearn-v2.1"},
        {"case_id": "BM-003", "case_date": "2026-08-05", "ai_prediction": "Acute Coronary Syndrome / Angina Evaluation", "doctor_diagnosis": "Acute Coronary Syndrome / Angina Evaluation", "outcome": "match", "actual_positive": True, "predicted_positive": True, "model_version": "clinical-nlp-sklearn-v2.1"},
        {"case_id": "BM-004", "case_date": "2026-08-19", "ai_prediction": "Migraine / Vascular Headache", "doctor_diagnosis": "Migraine / Vascular Headache", "outcome": "match", "actual_positive": True, "predicted_positive": True, "model_version": "clinical-nlp-sklearn-v2.1"},
        {"case_id": "BM-005", "case_date": "2026-09-03", "ai_prediction": "Gastroesophageal Reflux / Acute Gastritis", "doctor_diagnosis": "Atypical Angina Rule-Out", "outcome": "disagree", "actual_positive": True, "predicted_positive": False, "model_version": "clinical-nlp-sklearn-v2.1"},
        {"case_id": "BM-006", "case_date": "2026-09-18", "ai_prediction": "Bronchial Asthma Exacerbation", "doctor_diagnosis": "Community-Acquired Pneumonia", "outcome": "partial", "actual_positive": True, "predicted_positive": True, "model_version": "clinical-nlp-sklearn-v2.1"},
        {"case_id": "BM-007", "case_date": "2026-10-02", "ai_prediction": "Urinary Tract Infection (UTI)", "doctor_diagnosis": "Urinary Tract Infection (UTI)", "outcome": "match", "actual_positive": True, "predicted_positive": True, "model_version": "clinical-nlp-sklearn-v2.1"},
        {"case_id": "BM-008", "case_date": "2026-10-14", "ai_prediction": "Type 2 Diabetes Mellitus / Hyperglycemia Screen", "doctor_diagnosis": "Type 2 Diabetes Mellitus / Hyperglycemia Screen", "outcome": "match", "actual_positive": True, "predicted_positive": True, "model_version": "clinical-nlp-sklearn-v2.1"},
        {"case_id": "BM-009", "case_date": "2026-10-25", "ai_prediction": "Generalized Anxiety / Stress-Related Autonomic Response", "doctor_diagnosis": "Hypertensive Urgency / Essential Hypertension", "outcome": "disagree", "actual_positive": True, "predicted_positive": False, "model_version": "clinical-nlp-sklearn-v2.1"},
        {"case_id": "BM-010", "case_date": "2026-11-04", "ai_prediction": "Acute Gastroenteritis", "doctor_diagnosis": "Acute Gastroenteritis", "outcome": "match", "actual_positive": False, "predicted_positive": False, "model_version": "clinical-nlp-sklearn-v2.1"},
        {"case_id": "BM-011", "case_date": "2026-11-12", "ai_prediction": "Musculoskeletal Strain / Inflammatory Myalgia", "doctor_diagnosis": "Musculoskeletal Strain / Inflammatory Myalgia", "outcome": "match", "actual_positive": False, "predicted_positive": False, "model_version": "clinical-nlp-sklearn-v2.1"},
        {"case_id": "BM-012", "case_date": "2026-11-19", "ai_prediction": "Acute Viral Upper Respiratory Infection", "doctor_diagnosis": "Community-Acquired Pneumonia", "outcome": "partial", "actual_positive": True, "predicted_positive": False, "model_version": "clinical-nlp-sklearn-v2.1"},
    ]
    ds = ResearchDataset(
        created_by_id=researcher.id,
        name="Clinical Concordance Sample Benchmark v2.1 (Demo)",
        description="Curated, de-identified sample benchmark dataset evaluating AI decision-support predictions against physician-confirmed diagnoses.",
        source_type="sample_benchmark",
        is_validated=True,
        is_deidentified=True,
        record_count=len(benchmark_records),
        ai_model_version="clinical-nlp-sklearn-v2.1",
        records_payload=benchmark_records,
    )
    db.add(ds)
    db.flush()

    db.add(
        ResearchProject(
            lead_researcher_id=researcher.id,
            title="Human-AI Diagnostic Concordance in Primary Care Triage",
            objective="Quantify agreement rates, risk-tier divergence, and symptom feature attribution between TF-IDF clinical NLP and board-certified physicians.",
            dataset_id=ds.id,
            status="active",
            findings_summary="Initial sample benchmark demonstrates strong alignment in classic infectious/respiratory vignettes and highlights critical clinician value in atypical cardiac risk escalation.",
        )
    )

    # 8. Notifications & Initial Audit
    db.add_all([
        Notification(user_id=patient1.id, category="comparison", title="2 Comparison Reports Ready", message="Your side-by-side AI vs Human Doctor comparison reports are ready to review and export.", link_url="/comparison/dashboard"),
        Notification(user_id=patient1.id, category="appointment", title="Upcoming Follow-Up Appointment", message="Follow-up online consultation scheduled with Dr. Elena Vance.", link_url="/patient/appointments"),
        Notification(user_id=doc1.id, category="consultation", title="Pending Consultation Review", message="Maya Lin submitted severe headache symptoms with AI assessment for independent clinical review.", link_url="/doctor/assessment"),
        Notification(user_id=admin.id, category="account", title="1 Doctor Verification Pending", message="Dr. Priya Nair (Neurology) is awaiting credential verification.", link_url="/admin/doctors"),
    ])
    db.add(AuditLog(actor_user_id=admin.id, actor_role="admin", action="SYSTEM_DEMO_SEEDED", resource_type="system", resource_id="init", details={"mode": "demo"}))

    db.commit()
