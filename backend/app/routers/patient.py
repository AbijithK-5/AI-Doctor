import os
import uuid
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..ml.ai_engine import ai_engine
from ..models import (
    AIAssessment,
    AIPredictionRecord,
    Appointment,
    ComparisonResult,
    Consultation,
    DoctorAssessment,
    DoctorProfile,
    MedicalReport,
    PatientProfile,
    PatientSymptomRecord,
    Symptom,
    User,
)
from ..schemas import (
    AIAssessmentRequest,
    AIChatFollowUpRequest,
    AppointmentCreateRequest,
    AppointmentUpdateRequest,
    PatientProfileUpdate,
    SymptomSubmitRequest,
)
from ..security import create_notification, get_current_user, log_audit, require_roles

router = APIRouter(prefix="/api/patient", tags=["Patient"])


def _ensure_patient_profile(db: Session, user_id: int) -> PatientProfile:
    prof = db.query(PatientProfile).filter(PatientProfile.user_id == user_id).first()
    if not prof:
        prof = PatientProfile(user_id=user_id)
        db.add(prof)
        db.commit()
        db.refresh(prof)
    return prof


def _serialize_ai_assessment(a: AIAssessment) -> dict:
    return {
        "id": a.id,
        "patient_id": a.patient_id,
        "symptom_record_id": a.symptom_record_id,
        "model_name": a.model_name,
        "model_version": a.model_version,
        "is_demo_mode": a.is_demo_mode,
        "primary_summary": a.primary_summary,
        "possible_conditions": a.possible_conditions,
        "supporting_symptoms": a.supporting_symptoms,
        "missing_information": a.missing_information,
        "suggested_investigations": a.suggested_investigations,
        "risk_classification": a.risk_classification,
        "follow_up_questions": a.follow_up_questions,
        "general_health_education": a.general_health_education,
        "ai_recommendations": a.ai_recommendations,
        "explainability_factors": a.explainability_factors,
        "chat_history": a.chat_history,
        "disclaimer_text": a.disclaimer_text,
        "saved_by_patient": a.saved_by_patient,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


@router.get("/dashboard")
def get_patient_dashboard(current_user: User = Depends(require_roles(["patient"])), db: Session = Depends(get_db)):
    profile = _ensure_patient_profile(db, current_user.id)
    consultations = db.query(Consultation).filter(Consultation.patient_id == current_user.id).order_by(Consultation.created_at.desc()).all()
    ai_assessments = db.query(AIAssessment).filter(AIAssessment.patient_id == current_user.id).order_by(AIAssessment.created_at.desc()).all()
    appointments = db.query(Appointment).filter(Appointment.patient_id == current_user.id).order_by(Appointment.scheduled_at.asc()).all()
    reports = db.query(MedicalReport).filter(MedicalReport.patient_id == current_user.id).order_by(MedicalReport.uploaded_at.desc()).all()
    comparisons = db.query(ComparisonResult).filter(ComparisonResult.patient_id == current_user.id).order_by(ComparisonResult.compared_at.desc()).all()
    symptom_records = db.query(PatientSymptomRecord).filter(PatientSymptomRecord.patient_id == current_user.id).order_by(PatientSymptomRecord.created_at.desc()).all()

    doctor_map = {u.id: u for u in db.query(User).filter(User.role == "doctor").all()}
    doc_prof_map = {dp.user_id: dp for dp in db.query(DoctorProfile).all()}

    upcoming = []
    for appt in appointments:
        if appt.status in ("scheduled", "rescheduled"):
            doc = doctor_map.get(appt.doctor_id)
            dp = doc_prof_map.get(appt.doctor_id)
            upcoming.append({
                "id": appt.id,
                "doctor_id": appt.doctor_id,
                "doctor_name": doc.full_name if doc else "Physician",
                "speciality": dp.medical_speciality if dp else "General Medicine",
                "scheduled_at": appt.scheduled_at.isoformat(),
                "consultation_type": appt.consultation_type,
                "status": appt.status,
                "reason": appt.reason,
            })

    latest_comparisons = []
    for cmp in comparisons[:3]:
        doc_ass = db.query(DoctorAssessment).filter(DoctorAssessment.id == cmp.doctor_assessment_id).first()
        ai_ass = db.query(AIAssessment).filter(AIAssessment.id == cmp.ai_assessment_id).first()
        latest_comparisons.append({
            "id": cmp.id,
            "agreement_status": cmp.agreement_status,
            "agreement_score": cmp.agreement_score,
            "doctor_diagnosis": doc_ass.confirmed_diagnosis if doc_ass else "Confirmed Assessment",
            "ai_top_condition": (ai_ass.possible_conditions[0]["condition_name"] if ai_ass and ai_ass.possible_conditions else "N/A"),
            "compared_at": cmp.compared_at.isoformat(),
        })

    recent_activities = []
    for sr in symptom_records[:3]:
        recent_activities.append({"type": "symptom", "title": f"Logged symptom: {sr.main_symptom}", "timestamp": sr.created_at.isoformat()})
    for aa in ai_assessments[:3]:
        top_c = aa.possible_conditions[0]["condition_name"] if aa.possible_conditions else "AI Assessment"
        recent_activities.append({"type": "ai_assessment", "title": f"AI Decision-Support: {top_c}", "timestamp": aa.created_at.isoformat()})
    for rpt in reports[:2]:
        recent_activities.append({"type": "report", "title": f"Uploaded report: {rpt.title}", "timestamp": rpt.uploaded_at.isoformat()})
    recent_activities.sort(key=lambda x: x["timestamp"], reverse=True)

    return {
        "welcome_name": current_user.full_name,
        "profile_summary": {
            "age": profile.age,
            "gender": profile.gender or current_user.gender,
            "blood_group": profile.blood_group,
            "allergies_count": len(profile.known_allergies or []),
            "conditions_count": len(profile.existing_conditions or []),
            "medications_count": len(profile.current_medications or []),
        },
        "stats": {
            "total_consultations": len(consultations),
            "ai_assessments": len(ai_assessments),
            "doctor_consultations": len([c for c in consultations if c.status == "completed"]),
            "medical_reports": len(reports),
            "comparisons_count": len(comparisons),
        },
        "upcoming_appointments": upcoming[:5],
        "latest_comparisons": latest_comparisons,
        "recent_activities": recent_activities[:6],
        "health_history_summary": {
            "existing_conditions": profile.existing_conditions or [],
            "current_medications": profile.current_medications or [],
            "known_allergies": profile.known_allergies or [],
            "recent_symptoms": [s.main_symptom for s in symptom_records[:5]],
        },
    }


@router.get("/profile")
def get_patient_profile(current_user: User = Depends(require_roles(["patient"])), db: Session = Depends(get_db)):
    prof = _ensure_patient_profile(db, current_user.id)
    return {
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "phone_number": current_user.phone_number,
            "date_of_birth": current_user.date_of_birth.isoformat() if current_user.date_of_birth else None,
        },
        "age": prof.age,
        "gender": prof.gender or current_user.gender,
        "blood_group": prof.blood_group,
        "height_cm": prof.height_cm,
        "weight_kg": prof.weight_kg,
        "known_allergies": prof.known_allergies or [],
        "existing_conditions": prof.existing_conditions or [],
        "current_medications": prof.current_medications or [],
        "family_medical_history": prof.family_medical_history,
        "emergency_contact_name": prof.emergency_contact_name,
        "emergency_contact_phone": prof.emergency_contact_phone,
        "emergency_contact_relation": prof.emergency_contact_relation,
        "updated_at": prof.updated_at.isoformat() if prof.updated_at else None,
    }


@router.put("/profile")
def update_patient_profile(
    payload: PatientProfileUpdate,
    current_user: User = Depends(require_roles(["patient"])),
    db: Session = Depends(get_db),
):
    prof = _ensure_patient_profile(db, current_user.id)
    for field, val in payload.model_dump().items():
        setattr(prof, field, val)
    log_audit(db, current_user, "PATIENT_PROFILE_UPDATED", "patient_profile", str(prof.id), {})
    db.commit()
    db.refresh(prof)
    return {"message": "Patient profile updated successfully.", "profile_id": prof.id}


@router.get("/symptoms/catalog")
def list_symptom_catalog(q: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Symptom)
    if q:
        query = query.filter(Symptom.name.ilike(f"%{q}%"))
    items = query.order_by(Symptom.category.asc(), Symptom.name.asc()).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "body_system": s.body_system,
            "is_red_flag": s.is_red_flag,
            "description": s.description,
        }
        for s in items
    ]


@router.get("/symptoms")
def list_patient_symptoms(current_user: User = Depends(require_roles(["patient"])), db: Session = Depends(get_db)):
    records = (
        db.query(PatientSymptomRecord)
        .filter(PatientSymptomRecord.patient_id == current_user.id)
        .order_by(PatientSymptomRecord.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "main_symptom": r.main_symptom,
            "additional_symptoms": r.additional_symptoms,
            "duration": r.duration,
            "severity": r.severity,
            "frequency": r.frequency,
            "body_location": r.body_location,
            "onset_date": r.onset_date.isoformat() if r.onset_date else None,
            "relevant_medical_history": r.relevant_medical_history,
            "existing_medications": r.existing_medications,
            "additional_notes": r.additional_notes,
            "emergency_flagged": r.emergency_flagged,
            "created_at": r.created_at.isoformat(),
        }
        for r in records
    ]


def _create_ai_assessment_record(
    db: Session,
    patient: User,
    symptom_record: Optional[PatientSymptomRecord],
    main_symptom: str,
    additional_symptoms: list,
    duration: str,
    severity: str,
    medical_history: Optional[str],
    existing_medications: list,
) -> AIAssessment:
    result = ai_engine.assess(
        main_symptom=main_symptom,
        additional_symptoms=additional_symptoms,
        duration=duration,
        severity=severity,
        medical_history=medical_history,
        existing_medications=existing_medications,
    )
    assessment = AIAssessment(
        patient_id=patient.id,
        symptom_record_id=symptom_record.id if symptom_record else None,
        model_name=result["model_name"],
        model_version=result["model_version"],
        is_demo_mode=result["is_demo_mode"],
        primary_summary=result["primary_summary"],
        possible_conditions=result["possible_conditions"],
        supporting_symptoms=result["supporting_symptoms"],
        missing_information=result["missing_information"],
        suggested_investigations=result["suggested_investigations"],
        risk_classification=result["risk_classification"],
        follow_up_questions=result["follow_up_questions"],
        general_health_education=result["general_health_education"],
        ai_recommendations=result["ai_recommendations"],
        explainability_factors=result["explainability_factors"],
        chat_history=[
            {
                "sender": "ai",
                "message": result["primary_summary"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ],
        disclaimer_text=result["disclaimer_text"],
        saved_by_patient=True,
    )
    db.add(assessment)
    db.flush()

    for cond in result["possible_conditions"]:
        db.add(
            AIPredictionRecord(
                ai_assessment_id=assessment.id,
                condition_name=cond["condition_name"],
                icd_code=cond["icd_code"],
                probability_score=cond["relative_likelihood_score"] / 100.0,
                is_calibrated=False,
                rank_order=cond["rank_order"],
                supporting_features=cond["matching_symptoms"],
                explanation=cond["explanation"],
            )
        )

    create_notification(
        db,
        user_id=patient.id,
        category="ai_assessment",
        title="AI Decision-Support Assessment Ready",
        message=f"Educational AI assessment for '{main_symptom}' is complete. Book a human doctor consultation for authoritative clinical review.",
        link_url="/patient/ai-doctor",
    )
    return assessment


@router.post("/symptoms", status_code=status.HTTP_201_CREATED)
def submit_symptoms(
    payload: SymptomSubmitRequest,
    current_user: User = Depends(require_roles(["patient"])),
    db: Session = Depends(get_db),
):
    profile = _ensure_patient_profile(db, current_user.id)
    # Check red flags immediately
    combined = [payload.main_symptom.lower()] + [s.lower() for s in payload.additional_symptoms]
    from ..ml.ai_engine import RED_FLAG_SYMPTOMS

    emergency_flag = payload.severity == "critical" or any(
        rf in sym or sym in rf for sym in combined for rf in RED_FLAG_SYMPTOMS
    )

    rec = PatientSymptomRecord(
        patient_id=current_user.id,
        main_symptom=payload.main_symptom.strip(),
        additional_symptoms=payload.additional_symptoms,
        duration=payload.duration,
        severity=payload.severity,
        frequency=payload.frequency,
        body_location=payload.body_location,
        onset_date=payload.onset_date,
        relevant_medical_history=payload.relevant_medical_history or ", ".join(profile.existing_conditions or []),
        existing_medications=payload.existing_medications or (profile.current_medications or []),
        additional_notes=payload.additional_notes,
        emergency_flagged=emergency_flag,
    )
    db.add(rec)
    db.flush()

    ai_ass = None
    if payload.run_ai_assessment:
        ai_ass = _create_ai_assessment_record(
            db,
            current_user,
            rec,
            rec.main_symptom,
            rec.additional_symptoms,
            rec.duration,
            rec.severity,
            rec.relevant_medical_history,
            rec.existing_medications,
        )

    log_audit(db, current_user, "SYMPTOM_SUBMITTED", "symptom_record", str(rec.id), {"emergency_flagged": emergency_flag})
    db.commit()
    db.refresh(rec)
    if ai_ass:
        db.refresh(ai_ass)

    return {
        "symptom_record_id": rec.id,
        "emergency_flagged": emergency_flag,
        "ai_assessment": _serialize_ai_assessment(ai_ass) if ai_ass else None,
    }


@router.get("/ai-assessments")
def list_ai_assessments(current_user: User = Depends(require_roles(["patient"])), db: Session = Depends(get_db)):
    items = (
        db.query(AIAssessment)
        .filter(AIAssessment.patient_id == current_user.id)
        .order_by(AIAssessment.created_at.desc())
        .all()
    )
    return [_serialize_ai_assessment(a) for a in items]


@router.post("/ai-assessments", status_code=status.HTTP_201_CREATED)
def generate_ai_assessment(
    payload: AIAssessmentRequest,
    current_user: User = Depends(require_roles(["patient"])),
    db: Session = Depends(get_db),
):
    profile = _ensure_patient_profile(db, current_user.id)
    sym_rec = None
    if payload.symptom_record_id:
        sym_rec = (
            db.query(PatientSymptomRecord)
            .filter(PatientSymptomRecord.id == payload.symptom_record_id, PatientSymptomRecord.patient_id == current_user.id)
            .first()
        )
        if not sym_rec:
            raise HTTPException(status_code=404, detail="Symptom record not found.")
        main_s = sym_rec.main_symptom
        add_s = sym_rec.additional_symptoms
        dur = sym_rec.duration
        sev = sym_rec.severity
        hist = sym_rec.relevant_medical_history
        meds = sym_rec.existing_medications
    else:
        if not payload.main_symptom:
            raise HTTPException(status_code=400, detail="Provide either symptom_record_id or main_symptom.")
        main_s = payload.main_symptom
        add_s = payload.additional_symptoms
        dur = payload.duration or "2 days"
        sev = payload.severity or "moderate"
        hist = payload.medical_history_notes or ", ".join(profile.existing_conditions or [])
        meds = profile.current_medications or []

    ass = _create_ai_assessment_record(db, current_user, sym_rec, main_s, add_s, dur, sev, hist, meds)
    log_audit(db, current_user, "AI_ASSESSMENT_GENERATED", "ai_assessment", str(ass.id), {})
    db.commit()
    db.refresh(ass)
    return _serialize_ai_assessment(ass)


@router.post("/ai-assessments/chat")
def ai_followup_chat(
    payload: AIChatFollowUpRequest,
    current_user: User = Depends(require_roles(["patient"])),
    db: Session = Depends(get_db),
):
    ass = (
        db.query(AIAssessment)
        .filter(AIAssessment.id == payload.assessment_id, AIAssessment.patient_id == current_user.id)
        .first()
    )
    if not ass:
        raise HTTPException(status_code=404, detail="AI assessment not found.")

    reply = ai_engine.generate_followup_reply(_serialize_ai_assessment(ass), payload.message)
    now_iso = datetime.now(timezone.utc).isoformat()
    history = list(ass.chat_history or [])
    history.append({"sender": "patient", "message": payload.message, "timestamp": now_iso})
    history.append({"sender": "ai", "message": reply, "timestamp": now_iso})
    ass.chat_history = history
    db.commit()
    return {"reply": reply, "chat_history": history}


@router.get("/doctors")
def search_doctors(
    q: Optional[str] = None,
    speciality: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doctors = db.query(User, DoctorProfile).join(DoctorProfile, User.id == DoctorProfile.user_id).filter(User.status == "active").all()
    results = []
    for u, dp in doctors:
        if speciality and speciality.lower() not in dp.medical_speciality.lower():
            continue
        if q:
            hay = f"{u.full_name} {dp.medical_speciality} {dp.hospital_name or ''} {dp.qualification}".lower()
            if q.lower() not in hay:
                continue
        results.append({
            "doctor_id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "qualification": dp.qualification,
            "medical_speciality": dp.medical_speciality,
            "registration_number": dp.registration_number,
            "years_of_experience": dp.years_of_experience,
            "hospital_name": dp.hospital_name,
            "availability_schedule": dp.availability_schedule,
            "verification_status": dp.verification_status,
            "rating": dp.rating,
            "bio": dp.bio,
        })
    return results


@router.get("/appointments")
def list_patient_appointments(current_user: User = Depends(require_roles(["patient"])), db: Session = Depends(get_db)):
    appts = db.query(Appointment).filter(Appointment.patient_id == current_user.id).order_by(Appointment.scheduled_at.desc()).all()
    docs = {u.id: u for u in db.query(User).filter(User.role == "doctor").all()}
    doc_profs = {dp.user_id: dp for dp in db.query(DoctorProfile).all()}
    out = []
    for a in appts:
        d = docs.get(a.doctor_id)
        dp = doc_profs.get(a.doctor_id)
        consult = db.query(Consultation).filter(Consultation.appointment_id == a.id).first()
        out.append({
            "id": a.id,
            "doctor_id": a.doctor_id,
            "doctor_name": d.full_name if d else "Physician",
            "speciality": dp.medical_speciality if dp else "General Medicine",
            "hospital_name": dp.hospital_name if dp else "",
            "scheduled_at": a.scheduled_at.isoformat(),
            "consultation_type": a.consultation_type,
            "status": a.status,
            "reason": a.reason,
            "notes": a.notes,
            "symptom_record_id": a.symptom_record_id,
            "ai_assessment_id": a.ai_assessment_id,
            "consultation_id": consult.id if consult else None,
            "consultation_status": consult.status if consult else None,
        })
    return out


@router.post("/appointments", status_code=status.HTTP_201_CREATED)
def book_appointment(
    payload: AppointmentCreateRequest,
    current_user: User = Depends(require_roles(["patient"])),
    db: Session = Depends(get_db),
):
    doc = db.query(User).filter(User.id == payload.doctor_id, User.role == "doctor", User.status == "active").first()
    if not doc:
        raise HTTPException(status_code=404, detail="Selected doctor not found.")

    appt = Appointment(
        patient_id=current_user.id,
        doctor_id=doc.id,
        symptom_record_id=payload.symptom_record_id,
        ai_assessment_id=payload.ai_assessment_id,
        scheduled_at=payload.scheduled_at,
        consultation_type=payload.consultation_type,
        status="scheduled",
        reason=payload.reason,
        notes=payload.notes,
    )
    db.add(appt)
    db.flush()

    consult = Consultation(
        appointment_id=appt.id,
        patient_id=current_user.id,
        doctor_id=doc.id,
        symptom_record_id=payload.symptom_record_id,
        ai_assessment_id=payload.ai_assessment_id,
        status="pending_review",
        shared_ai_for_comparison=payload.share_ai_with_doctor,
    )
    db.add(consult)
    db.flush()

    create_notification(
        db,
        user_id=current_user.id,
        category="appointment",
        title="Consultation Appointment Booked",
        message=f"Appointment scheduled with {doc.full_name} on {payload.scheduled_at.strftime('%Y-%m-%d %H:%M')}.",
        link_url="/patient/appointments",
    )
    create_notification(
        db,
        user_id=doc.id,
        category="consultation",
        title="New Patient Consultation Request",
        message=f"{current_user.full_name} requested a consultation{' with AI assessment attached for comparison' if payload.ai_assessment_id else ''}.",
        link_url="/doctor/assessment",
    )
    log_audit(db, current_user, "APPOINTMENT_BOOKED", "appointment", str(appt.id), {"doctor_id": doc.id})
    db.commit()
    return {"appointment_id": appt.id, "consultation_id": consult.id, "status": appt.status}


@router.put("/appointments/{appointment_id}")
def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdateRequest,
    current_user: User = Depends(require_roles(["patient", "doctor"])),
    db: Session = Depends(get_db),
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    if current_user.id not in (appt.patient_id, appt.doctor_id):
        raise HTTPException(status_code=403, detail="Access denied.")

    if payload.scheduled_at is not None:
        appt.scheduled_at = payload.scheduled_at
        if payload.status is None:
            appt.status = "rescheduled"
    if payload.status is not None:
        appt.status = payload.status
    if payload.consultation_type is not None:
        appt.consultation_type = payload.consultation_type
    if payload.notes is not None:
        appt.notes = payload.notes

    log_audit(db, current_user, "APPOINTMENT_UPDATED", "appointment", str(appt.id), {"status": appt.status})
    db.commit()
    return {"message": "Appointment updated.", "status": appt.status}


@router.get("/consultations")
def list_patient_consultations(current_user: User = Depends(require_roles(["patient"])), db: Session = Depends(get_db)):
    consults = db.query(Consultation).filter(Consultation.patient_id == current_user.id).order_by(Consultation.created_at.desc()).all()
    docs = {u.id: u for u in db.query(User).filter(User.role == "doctor").all()}
    doc_profs = {dp.user_id: dp for dp in db.query(DoctorProfile).all()}
    out = []
    for c in consults:
        d = docs.get(c.doctor_id)
        dp = doc_profs.get(c.doctor_id)
        da = db.query(DoctorAssessment).filter(DoctorAssessment.consultation_id == c.id).first()
        cmp = db.query(ComparisonResult).filter(ComparisonResult.consultation_id == c.id).first()
        out.append({
            "id": c.id,
            "appointment_id": c.appointment_id,
            "doctor_id": c.doctor_id,
            "doctor_name": d.full_name if d else "Physician",
            "speciality": dp.medical_speciality if dp else "General Medicine",
            "status": c.status,
            "ai_assessment_id": c.ai_assessment_id,
            "doctor_notes": c.doctor_notes,
            "doctor_assessment": {
                "id": da.id,
                "confirmed_diagnosis": da.confirmed_diagnosis,
                "clinical_assessment": da.clinical_assessment,
                "risk_classification": da.risk_classification,
                "recommended_investigations": da.recommended_investigations,
                "treatment_plan": da.treatment_plan,
                "prescription": da.prescription,
            } if da else None,
            "comparison_id": cmp.id if cmp else None,
            "created_at": c.created_at.isoformat(),
        })
    return out


@router.get("/reports")
def list_reports(
    category: Optional[str] = None,
    current_user: User = Depends(require_roles(["patient"])),
    db: Session = Depends(get_db),
):
    q = db.query(MedicalReport).filter(MedicalReport.patient_id == current_user.id)
    if category and category != "all":
        q = q.filter(MedicalReport.category == category)
    reports = q.order_by(MedicalReport.report_date.desc()).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "category": r.category,
            "file_name": r.file_name,
            "mime_type": r.mime_type,
            "file_size_bytes": r.file_size_bytes,
            "report_date": r.report_date.isoformat(),
            "consultation_id": r.consultation_id,
            "notes": r.notes,
            "uploaded_at": r.uploaded_at.isoformat(),
        }
        for r in reports
    ]


@router.post("/reports", status_code=status.HTTP_201_CREATED)
async def upload_report(
    title: str = Form(...),
    category: str = Form(...),
    report_date: date = Form(...),
    consultation_id: Optional[int] = Form(None),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(["patient"])),
    db: Session = Depends(get_db),
):
    allowed_ext = {".pdf", ".png", ".jpg", ".jpeg", ".txt", ".csv", ".json"}
    ext = Path(file.filename or "report.pdf").suffix.lower()
    if ext not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(allowed_ext))}.")

    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit.")

    patient_dir = Path(settings.UPLOAD_DIR) / f"patient_{current_user.id}"
    patient_dir.mkdir(parents=True, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}_{Path(file.filename or 'report').name}"
    dest = patient_dir / safe_name
    dest.write_bytes(content)

    rpt = MedicalReport(
        patient_id=current_user.id,
        consultation_id=consultation_id,
        title=title.strip(),
        category=category,
        file_name=file.filename or safe_name,
        stored_path=str(dest),
        mime_type=file.content_type or "application/octet-stream",
        file_size_bytes=len(content),
        report_date=report_date,
        notes=notes,
    )
    db.add(rpt)
    create_notification(
        db,
        user_id=current_user.id,
        category="report",
        title="Medical Report Uploaded",
        message=f"'{title}' ({category}) has been securely stored in your medical vault.",
        link_url="/patient/reports",
    )
    log_audit(db, current_user, "REPORT_UPLOADED", "medical_report", safe_name, {"category": category})
    db.commit()
    db.refresh(rpt)
    return {"id": rpt.id, "title": rpt.title, "file_name": rpt.file_name}


@router.get("/reports/{report_id}/download")
def download_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rpt = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not rpt:
        raise HTTPException(status_code=404, detail="Report not found.")
    if current_user.role == "patient" and rpt.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    if current_user.role == "researcher":
        raise HTTPException(status_code=403, detail="Researchers may only access de-identified aggregate data.")

    if not os.path.exists(rpt.stored_path):
        # Provide a clean generated placeholder text/PDF if seeded demo path doesn't exist on disk
        from reportlab.platypus import Paragraph, SimpleDocTemplate
        from reportlab.lib.styles import getSampleStyleSheet
        Path(rpt.stored_path).parent.mkdir(parents=True, exist_ok=True)
        doc = SimpleDocTemplate(rpt.stored_path)
        styles = getSampleStyleSheet()
        doc.build([
            Paragraph(f"Medical Report: {rpt.title}", styles["Title"]),
            Paragraph(f"Category: {rpt.category} | Date: {rpt.report_date}", styles["Normal"]),
            Paragraph(f"Clinical Notes: {rpt.notes or 'Demo medical report document.'}", styles["Normal"]),
        ])

    return FileResponse(path=rpt.stored_path, filename=rpt.file_name, media_type=rpt.mime_type)


@router.delete("/reports/{report_id}")
def delete_report(
    report_id: int,
    current_user: User = Depends(require_roles(["patient", "admin"])),
    db: Session = Depends(get_db),
):
    rpt = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not rpt:
        raise HTTPException(status_code=404, detail="Report not found.")
    if current_user.role == "patient" and rpt.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    if os.path.exists(rpt.stored_path):
        try:
            os.remove(rpt.stored_path)
        except OSError:
            pass
    db.delete(rpt)
    log_audit(db, current_user, "REPORT_DELETED", "medical_report", str(report_id), {})
    db.commit()
    return {"message": "Report deleted."}


@router.get("/history")
def get_health_history(
    category: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(require_roles(["patient"])),
    db: Session = Depends(get_db),
):
    symptoms = db.query(PatientSymptomRecord).filter(PatientSymptomRecord.patient_id == current_user.id).order_by(PatientSymptomRecord.created_at.desc()).all()
    ai_assessments = db.query(AIAssessment).filter(AIAssessment.patient_id == current_user.id).order_by(AIAssessment.created_at.desc()).all()
    consultations = db.query(Consultation).filter(Consultation.patient_id == current_user.id).order_by(Consultation.created_at.desc()).all()
    doctor_assessments = db.query(DoctorAssessment).filter(DoctorAssessment.patient_id == current_user.id).order_by(DoctorAssessment.created_at.desc()).all()
    reports = db.query(MedicalReport).filter(MedicalReport.patient_id == current_user.id).order_by(MedicalReport.report_date.desc()).all()
    appointments = db.query(Appointment).filter(Appointment.patient_id == current_user.id).order_by(Appointment.scheduled_at.desc()).all()
    comparisons = db.query(ComparisonResult).filter(ComparisonResult.patient_id == current_user.id).order_by(ComparisonResult.compared_at.desc()).all()

    docs = {u.id: u.full_name for u in db.query(User).filter(User.role == "doctor").all()}

    timeline = []
    for s in symptoms:
        timeline.append({
            "id": f"sym-{s.id}",
            "category": "symptoms",
            "title": f"Symptom Entry: {s.main_symptom}",
            "summary": f"Severity: {s.severity} | Duration: {s.duration} | Additional: {', '.join(s.additional_symptoms or [])}",
            "date": s.created_at.isoformat(),
        })
    for a in ai_assessments:
        top_c = a.possible_conditions[0]["condition_name"] if a.possible_conditions else "Decision-Support Summary"
        timeline.append({
            "id": f"ai-{a.id}",
            "category": "ai_assessments",
            "title": f"AI Decision-Support: {top_c}",
            "summary": f"Risk: {a.risk_classification.upper()} — {a.primary_summary[:140]}",
            "date": a.created_at.isoformat(),
        })
    for da in doctor_assessments:
        timeline.append({
            "id": f"doc-{da.id}",
            "category": "diagnoses",
            "title": f"Doctor Confirmed Diagnosis: {da.confirmed_diagnosis}",
            "summary": f"By {docs.get(da.doctor_id, 'Physician')} | Risk: {da.risk_classification.upper()} | Rx: {da.prescription or 'None recorded'}",
            "date": da.created_at.isoformat(),
        })
    for r in reports:
        timeline.append({
            "id": f"rpt-{r.id}",
            "category": "reports",
            "title": f"Medical Report: {r.title}",
            "summary": f"Category: {r.category} | File: {r.file_name}",
            "date": f"{r.report_date.isoformat()}T00:00:00",
        })
    for c in comparisons:
        timeline.append({
            "id": f"cmp-{c.id}",
            "category": "comparisons",
            "title": f"AI vs Human Comparison ({c.agreement_score}% alignment)",
            "summary": f"Status: {c.agreement_status.replace('_', ' ').upper()}",
            "date": c.compared_at.isoformat(),
        })

    if category and category != "all":
        timeline = [t for t in timeline if t["category"] == category]
    if date_from:
        timeline = [t for t in timeline if t["date"][:10] >= date_from]
    if date_to:
        timeline = [t for t in timeline if t["date"][:10] <= date_to]

    timeline.sort(key=lambda x: x["date"], reverse=True)

    return {
        "timeline": timeline,
        "diagnoses": [
            {
                "id": da.id,
                "confirmed_diagnosis": da.confirmed_diagnosis,
                "doctor_name": docs.get(da.doctor_id, "Physician"),
                "prescription": da.prescription,
                "treatment_plan": da.treatment_plan,
                "date": da.created_at.isoformat(),
            }
            for da in doctor_assessments
        ],
        "prescriptions": [
            {
                "diagnosis": da.confirmed_diagnosis,
                "prescription": da.prescription,
                "doctor_name": docs.get(da.doctor_id, "Physician"),
                "date": da.created_at.isoformat(),
            }
            for da in doctor_assessments
            if da.prescription
        ],
        "appointments_count": len(appointments),
        "consultations_count": len(consultations),
    }
