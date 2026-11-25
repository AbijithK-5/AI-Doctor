from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AIAssessment, ComparisonResult, DoctorAssessment, DoctorProfile, PatientProfile, User
from ..security import get_current_user
from ..services.pdf_service import build_comparison_pdf

router = APIRouter(prefix="/api/comparisons", tags=["Comparison Engine"])


def _build_full_comparison_payload(cmp: ComparisonResult, db: Session) -> dict:
    ai_ass = db.query(AIAssessment).filter(AIAssessment.id == cmp.ai_assessment_id).first()
    doc_ass = db.query(DoctorAssessment).filter(DoctorAssessment.id == cmp.doctor_assessment_id).first()
    patient = db.query(User).filter(User.id == cmp.patient_id).first()
    patient_prof = db.query(PatientProfile).filter(PatientProfile.user_id == cmp.patient_id).first()
    doctor = db.query(User).filter(User.id == doc_ass.doctor_id).first() if doc_ass else None
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == doc_ass.doctor_id).first() if doc_ass else None

    return {
        "id": cmp.id,
        "consultation_id": cmp.consultation_id,
        "patient_id": cmp.patient_id,
        "patient_name": patient.full_name if patient else "Patient",
        "patient_age": patient_prof.age if patient_prof else None,
        "patient_gender": (patient_prof.gender if patient_prof else None) or (patient.gender if patient else None),
        "doctor_name": doctor.full_name if doctor else "Physician",
        "doctor_speciality": doc_prof.medical_speciality if doc_prof else "General Medicine",
        "agreement_status": cmp.agreement_status,
        "agreement_score": cmp.agreement_score,
        "matching_conditions": cmp.matching_conditions,
        "different_conditions": cmp.different_conditions,
        "shared_symptoms": cmp.shared_symptoms,
        "missing_symptoms": cmp.missing_symptoms,
        "similar_investigations": cmp.similar_investigations,
        "different_investigations": cmp.different_investigations,
        "areas_of_agreement": cmp.areas_of_agreement,
        "areas_of_disagreement": cmp.areas_of_disagreement,
        "risk_comparison": cmp.risk_comparison,
        "treatment_comparison": cmp.treatment_comparison,
        "authoritative_statement": cmp.authoritative_statement,
        "compared_at": cmp.compared_at.isoformat() if cmp.compared_at else None,
        "ai_assessment": {
            "id": ai_ass.id,
            "model_name": ai_ass.model_name,
            "model_version": ai_ass.model_version,
            "is_demo_mode": ai_ass.is_demo_mode,
            "primary_summary": ai_ass.primary_summary,
            "possible_conditions": ai_ass.possible_conditions,
            "supporting_symptoms": ai_ass.supporting_symptoms,
            "suggested_investigations": ai_ass.suggested_investigations,
            "risk_classification": ai_ass.risk_classification,
            "ai_recommendations": ai_ass.ai_recommendations,
            "explainability_factors": ai_ass.explainability_factors,
            "disclaimer_text": ai_ass.disclaimer_text,
        } if ai_ass else {},
        "doctor_assessment": {
            "id": doc_ass.id,
            "clinical_observations": doc_ass.clinical_observations,
            "symptoms_identified": doc_ass.symptoms_identified,
            "clinical_assessment": doc_ass.clinical_assessment,
            "confirmed_diagnosis": doc_ass.confirmed_diagnosis,
            "differential_diagnoses": doc_ass.differential_diagnoses,
            "recommended_investigations": doc_ass.recommended_investigations,
            "risk_classification": doc_ass.risk_classification,
            "treatment_plan": doc_ass.treatment_plan,
            "prescription": doc_ass.prescription,
            "additional_notes": doc_ass.additional_notes,
            "ai_suggestion_reviews": doc_ass.ai_suggestion_reviews,
            "disagreement_notes": doc_ass.disagreement_notes,
        } if doc_ass else {},
    }


@router.get("")
def list_comparisons(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(ComparisonResult)
    if current_user.role == "patient":
        q = q.filter(ComparisonResult.patient_id == current_user.id)
    elif current_user.role == "doctor":
        doc_ass_ids = [d.id for d in db.query(DoctorAssessment).filter(DoctorAssessment.doctor_id == current_user.id).all()]
        q = q.filter(ComparisonResult.doctor_assessment_id.in_(doc_ass_ids)) if doc_ass_ids else q.filter(False)

    items = q.order_by(ComparisonResult.compared_at.desc()).all()
    results = []
    for cmp in items:
        payload = _build_full_comparison_payload(cmp, db)
        if current_user.role == "researcher":
            # De-identify patient details for researchers
            payload["patient_name"] = f"De-identified Subject #{cmp.patient_id:04d}"
        results.append(payload)
    return results


@router.get("/{comparison_id}")
def get_comparison_detail(
    comparison_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cmp = db.query(ComparisonResult).filter(ComparisonResult.id == comparison_id).first()
    if not cmp:
        raise HTTPException(status_code=404, detail="Comparison record not found.")

    payload = _build_full_comparison_payload(cmp, db)
    if current_user.role == "patient" and cmp.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    if current_user.role == "researcher":
        payload["patient_name"] = f"De-identified Subject #{cmp.patient_id:04d}"
    return payload


@router.get("/{comparison_id}/pdf")
def export_comparison_pdf(
    comparison_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cmp = db.query(ComparisonResult).filter(ComparisonResult.id == comparison_id).first()
    if not cmp:
        raise HTTPException(status_code=404, detail="Comparison record not found.")
    if current_user.role == "patient" and cmp.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    payload = _build_full_comparison_payload(cmp, db)
    if current_user.role == "researcher":
        payload["patient_name"] = f"De-identified Subject #{cmp.patient_id:04d}"

    pdf_bytes = build_comparison_pdf(payload)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="comparison_report_{comparison_id}.pdf"'},
    )
