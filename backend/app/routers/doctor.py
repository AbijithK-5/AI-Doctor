from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    AIAssessment,
    Appointment,
    ComparisonResult,
    Consultation,
    DoctorAssessment,
    DoctorProfile,
    DoctorVerification,
    MedicalReport,
    PatientProfile,
    PatientSymptomRecord,
    User,
)
from ..schemas import DoctorAssessmentSubmitRequest, DoctorProfileUpdate
from ..security import create_notification, log_audit, require_roles
from ..services.comparison_engine import compute_comparison

router = APIRouter(prefix="/api/doctor", tags=["Doctor"])


def _ensure_doctor_profile(db: Session, user: User) -> DoctorProfile:
    dp = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
    if not dp:
        dp = DoctorProfile(
            user_id=user.id,
            qualification="MBBS, MD",
            medical_speciality="Internal Medicine",
            registration_number=f"MED-REG-{user.id:05d}",
            years_of_experience=3,
            hospital_name="Partner Clinical Center",
            contact_info=user.email,
            verification_status="pending",
        )
        db.add(dp)
        db.commit()
        db.refresh(dp)
    return dp


@router.get("/dashboard")
def get_doctor_dashboard(current_user: User = Depends(require_roles(["doctor"])), db: Session = Depends(get_db)):
    _ensure_doctor_profile(db, current_user)
    consultations = db.query(Consultation).filter(Consultation.doctor_id == current_user.id).order_by(Consultation.created_at.desc()).all()
    appointments = db.query(Appointment).filter(Appointment.doctor_id == current_user.id).order_by(Appointment.scheduled_at.asc()).all()
    patient_ids = {c.patient_id for c in consultations} | {a.patient_id for a in appointments}
    patients = {u.id: u for u in db.query(User).filter(User.id.in_(patient_ids)).all()} if patient_ids else {}

    pending_consults = [c for c in consultations if c.status != "completed"]
    completed_consults = [c for c in consultations if c.status == "completed"]
    comparison_requests = [c for c in pending_consults if c.ai_assessment_id is not None]

    upcoming_appts = [
        {
            "id": a.id,
            "patient_id": a.patient_id,
            "patient_name": patients[a.patient_id].full_name if a.patient_id in patients else "Patient",
            "scheduled_at": a.scheduled_at.isoformat(),
            "consultation_type": a.consultation_type,
            "status": a.status,
            "reason": a.reason,
        }
        for a in appointments
        if a.status in ("scheduled", "rescheduled")
    ]

    recent_activity = []
    for c in consultations[:6]:
        pname = patients[c.patient_id].full_name if c.patient_id in patients else "Patient"
        recent_activity.append({
            "consultation_id": c.id,
            "patient_id": c.patient_id,
            "patient_name": pname,
            "status": c.status,
            "has_ai_assessment": c.ai_assessment_id is not None,
            "created_at": c.created_at.isoformat(),
        })

    return {
        "doctor_name": current_user.full_name,
        "stats": {
            "total_patients": len(patient_ids),
            "upcoming_appointments": len(upcoming_appts),
            "pending_consultations": len(pending_consults),
            "completed_consultations": len(completed_consults),
            "pending_assessment_reviews": len(pending_consults),
            "comparison_requests": len(comparison_requests),
        },
        "upcoming_appointments": upcoming_appts[:6],
        "recent_activity": recent_activity,
    }


@router.get("/profile")
def get_doctor_profile(current_user: User = Depends(require_roles(["doctor"])), db: Session = Depends(get_db)):
    dp = _ensure_doctor_profile(db, current_user)
    return {
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone_number": current_user.phone_number,
        "qualification": dp.qualification,
        "medical_speciality": dp.medical_speciality,
        "registration_number": dp.registration_number,
        "years_of_experience": dp.years_of_experience,
        "hospital_name": dp.hospital_name,
        "contact_info": dp.contact_info,
        "availability_schedule": dp.availability_schedule,
        "profile_photo_url": dp.profile_photo_url,
        "bio": dp.bio,
        "verification_status": dp.verification_status,
        "rating": dp.rating,
    }


@router.put("/profile")
def update_doctor_profile(
    payload: DoctorProfileUpdate,
    current_user: User = Depends(require_roles(["doctor"])),
    db: Session = Depends(get_db),
):
    dp = _ensure_doctor_profile(db, current_user)
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(dp, k, v)
    log_audit(db, current_user, "DOCTOR_PROFILE_UPDATED", "doctor_profile", str(dp.id), {})
    db.commit()
    return {"message": "Doctor profile updated successfully."}


@router.get("/patients")
def list_doctor_patients(
    q: Optional[str] = None,
    current_user: User = Depends(require_roles(["doctor"])),
    db: Session = Depends(get_db),
):
    # Doctors see patients who have consultations/appointments with them, plus demo patients for review
    consult_pids = {c.patient_id for c in db.query(Consultation).filter(Consultation.doctor_id == current_user.id).all()}
    all_patients = db.query(User).filter(User.role == "patient", User.status == "active").all()
    results = []
    for p in all_patients:
        if q and q.lower() not in f"{p.full_name} {p.email}".lower():
            continue
        prof = db.query(PatientProfile).filter(PatientProfile.user_id == p.id).first()
        consult_count = db.query(Consultation).filter(Consultation.patient_id == p.id).count()
        ai_count = db.query(AIAssessment).filter(AIAssessment.patient_id == p.id).count()
        results.append({
            "id": p.id,
            "full_name": p.full_name,
            "email": p.email,
            "phone_number": p.phone_number,
            "age": prof.age if prof else None,
            "gender": (prof.gender if prof else None) or p.gender,
            "blood_group": prof.blood_group if prof else None,
            "existing_conditions": prof.existing_conditions if prof else [],
            "assigned_to_me": p.id in consult_pids,
            "consultations_count": consult_count,
            "ai_assessments_count": ai_count,
        })
    return results


@router.get("/patients/{patient_id}")
def get_patient_detail_for_doctor(
    patient_id: int,
    current_user: User = Depends(require_roles(["doctor"])),
    db: Session = Depends(get_db),
):
    patient = db.query(User).filter(User.id == patient_id, User.role == "patient").first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    prof = db.query(PatientProfile).filter(PatientProfile.user_id == patient_id).first()
    symptoms = db.query(PatientSymptomRecord).filter(PatientSymptomRecord.patient_id == patient_id).order_by(PatientSymptomRecord.created_at.desc()).all()
    ai_list = db.query(AIAssessment).filter(AIAssessment.patient_id == patient_id).order_by(AIAssessment.created_at.desc()).all()
    reports = db.query(MedicalReport).filter(MedicalReport.patient_id == patient_id).order_by(MedicalReport.report_date.desc()).all()
    comparisons = db.query(ComparisonResult).filter(ComparisonResult.patient_id == patient_id).order_by(ComparisonResult.compared_at.desc()).all()
    consults = db.query(Consultation).filter(Consultation.patient_id == patient_id).order_by(Consultation.created_at.desc()).all()

    return {
        "patient": {
            "id": patient.id,
            "full_name": patient.full_name,
            "email": patient.email,
            "phone_number": patient.phone_number,
            "age": prof.age if prof else None,
            "gender": (prof.gender if prof else None) or patient.gender,
            "blood_group": prof.blood_group if prof else None,
            "known_allergies": prof.known_allergies if prof else [],
            "existing_conditions": prof.existing_conditions if prof else [],
            "current_medications": prof.current_medications if prof else [],
            "family_medical_history": prof.family_medical_history if prof else None,
        },
        "symptom_records": [
            {
                "id": s.id,
                "main_symptom": s.main_symptom,
                "additional_symptoms": s.additional_symptoms,
                "duration": s.duration,
                "severity": s.severity,
                "notes": s.additional_notes,
                "created_at": s.created_at.isoformat(),
            }
            for s in symptoms
        ],
        "ai_assessments": [
            {
                "id": a.id,
                "primary_summary": a.primary_summary,
                "possible_conditions": a.possible_conditions,
                "risk_classification": a.risk_classification,
                "suggested_investigations": a.suggested_investigations,
                "created_at": a.created_at.isoformat(),
            }
            for a in ai_list
        ],
        "reports": [
            {
                "id": r.id,
                "title": r.title,
                "category": r.category,
                "file_name": r.file_name,
                "report_date": r.report_date.isoformat(),
            }
            for r in reports
        ],
        "comparisons": [
            {
                "id": c.id,
                "agreement_status": c.agreement_status,
                "agreement_score": c.agreement_score,
                "compared_at": c.compared_at.isoformat(),
            }
            for c in comparisons
        ],
        "consultations": [
            {
                "id": co.id,
                "status": co.status,
                "ai_assessment_id": co.ai_assessment_id,
                "created_at": co.created_at.isoformat(),
            }
            for co in consults
        ],
    }


@router.get("/consultations")
def list_doctor_consultations(current_user: User = Depends(require_roles(["doctor"])), db: Session = Depends(get_db)):
    consults = db.query(Consultation).filter(Consultation.doctor_id == current_user.id).order_by(Consultation.created_at.desc()).all()
    pids = {c.patient_id for c in consults}
    patients = {u.id: u for u in db.query(User).filter(User.id.in_(pids)).all()} if pids else {}
    out = []
    for c in consults:
        p = patients.get(c.patient_id)
        sym = db.query(PatientSymptomRecord).filter(PatientSymptomRecord.id == c.symptom_record_id).first() if c.symptom_record_id else None
        ai_ass = db.query(AIAssessment).filter(AIAssessment.id == c.ai_assessment_id).first() if c.ai_assessment_id else None
        doc_ass = db.query(DoctorAssessment).filter(DoctorAssessment.consultation_id == c.id).first()
        cmp = db.query(ComparisonResult).filter(ComparisonResult.consultation_id == c.id).first()
        out.append({
            "id": c.id,
            "patient_id": c.patient_id,
            "patient_name": p.full_name if p else "Patient",
            "status": c.status,
            "shared_ai_for_comparison": c.shared_ai_for_comparison,
            "symptom_record": {
                "id": sym.id,
                "main_symptom": sym.main_symptom,
                "additional_symptoms": sym.additional_symptoms,
                "duration": sym.duration,
                "severity": sym.severity,
                "relevant_medical_history": sym.relevant_medical_history,
            } if sym else None,
            "ai_assessment": {
                "id": ai_ass.id,
                "primary_summary": ai_ass.primary_summary,
                "possible_conditions": ai_ass.possible_conditions,
                "supporting_symptoms": ai_ass.supporting_symptoms,
                "suggested_investigations": ai_ass.suggested_investigations,
                "risk_classification": ai_ass.risk_classification,
                "ai_recommendations": ai_ass.ai_recommendations,
            } if ai_ass else None,
            "doctor_assessment": {
                "id": doc_ass.id,
                "confirmed_diagnosis": doc_ass.confirmed_diagnosis,
                "risk_classification": doc_ass.risk_classification,
                "ai_suggestion_reviews": doc_ass.ai_suggestion_reviews,
            } if doc_ass else None,
            "comparison_id": cmp.id if cmp else None,
            "created_at": c.created_at.isoformat(),
        })
    return out


@router.post("/assessments", status_code=status.HTTP_201_CREATED)
def submit_doctor_assessment(
    payload: DoctorAssessmentSubmitRequest,
    current_user: User = Depends(require_roles(["doctor"])),
    db: Session = Depends(get_db),
):
    consult = db.query(Consultation).filter(Consultation.id == payload.consultation_id).first()
    if not consult:
        raise HTTPException(status_code=404, detail="Consultation not found.")
    if consult.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not assigned to this consultation.")

    existing = db.query(DoctorAssessment).filter(DoctorAssessment.consultation_id == consult.id).first()
    if existing:
        # Update existing assessment and recompute comparison
        for field, val in payload.model_dump(exclude={"consultation_id"}).items():
            setattr(existing, field, val)
        doc_ass = existing
    else:
        doc_ass = DoctorAssessment(
            consultation_id=consult.id,
            patient_id=consult.patient_id,
            doctor_id=current_user.id,
            clinical_observations=payload.clinical_observations,
            symptoms_identified=payload.symptoms_identified,
            clinical_assessment=payload.clinical_assessment,
            confirmed_diagnosis=payload.confirmed_diagnosis,
            differential_diagnoses=payload.differential_diagnoses,
            recommended_investigations=payload.recommended_investigations,
            risk_classification=payload.risk_classification,
            treatment_plan=payload.treatment_plan,
            prescription=payload.prescription,
            additional_notes=payload.additional_notes,
            ai_suggestion_reviews=payload.ai_suggestion_reviews,
            disagreement_notes=payload.disagreement_notes,
        )
        db.add(doc_ass)

    consult.status = "completed"
    consult.completed_at = datetime.now(timezone.utc)
    consult.doctor_notes = payload.clinical_assessment
    if consult.appointment_id:
        appt = db.query(Appointment).filter(Appointment.id == consult.appointment_id).first()
        if appt:
            appt.status = "completed"
    db.flush()

    comparison_id = None
    if consult.ai_assessment_id:
        ai_ass = db.query(AIAssessment).filter(AIAssessment.id == consult.ai_assessment_id).first()
        if ai_ass:
            comp_data = compute_comparison(ai_ass, doc_ass)
            existing_cmp = db.query(ComparisonResult).filter(ComparisonResult.consultation_id == consult.id).first()
            if existing_cmp:
                for k, v in comp_data.items():
                    setattr(existing_cmp, k, v)
                cmp = existing_cmp
            else:
                cmp = ComparisonResult(
                    patient_id=consult.patient_id,
                    consultation_id=consult.id,
                    ai_assessment_id=ai_ass.id,
                    doctor_assessment_id=doc_ass.id,
                    **comp_data,
                )
                db.add(cmp)
                db.flush()
            comparison_id = cmp.id

            create_notification(
                db,
                user_id=consult.patient_id,
                category="comparison",
                title="AI vs Human Doctor Comparison Available",
                message=f"Dr. {current_user.full_name} completed your clinical assessment. View the side-by-side comparison report.",
                link_url=f"/comparison/report/{comparison_id}",
            )

    create_notification(
        db,
        user_id=consult.patient_id,
        category="doctor_response",
        title="Doctor Clinical Assessment Submitted",
        message=f"Dr. {current_user.full_name} recorded a clinical assessment: {payload.confirmed_diagnosis}.",
        link_url="/patient/consultations",
    )
    log_audit(db, current_user, "DOCTOR_ASSESSMENT_SUBMITTED", "doctor_assessment", str(doc_ass.id), {"comparison_id": comparison_id})
    db.commit()
    return {
        "doctor_assessment_id": doc_ass.id,
        "comparison_id": comparison_id,
        "message": "Clinical assessment saved and Comparison Engine updated.",
    }
