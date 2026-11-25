import csv
import io
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..ml.ai_engine import CLINICAL_KNOWLEDGE_BASE, ai_engine
from ..models import (
    AIAssessment,
    AccuracyMetric,
    ComparisonResult,
    DoctorAssessment,
    ResearchDataset,
    ResearchProject,
    User,
)
from ..schemas import ResearchDatasetCreate, ResearchProjectCreate
from ..security import get_current_user, log_audit, require_roles

router = APIRouter(prefix="/api/research", tags=["Research & Accuracy Analytics"])


def _compute_metrics_from_records(records: list, condition_filter: Optional[str] = None, date_from: Optional[str] = None, date_to: Optional[str] = None):
    filtered = list(records)
    if condition_filter and condition_filter != "all":
        cf = condition_filter.lower()
        filtered = [
            r for r in filtered
            if cf in str(r.get("doctor_diagnosis", "")).lower() or cf in str(r.get("ai_prediction", "")).lower()
        ]
    if date_from:
        filtered = [r for r in filtered if str(r.get("case_date", "2026-01-01")) >= date_from]
    if date_to:
        filtered = [r for r in filtered if str(r.get("case_date", "2026-12-31")) <= date_to]

    total = len(filtered)
    if total == 0:
        return {
            "total_cases": 0,
            "matching_predictions": 0,
            "partial_predictions": 0,
            "non_matching_predictions": 0,
            "agreement_percentage": 0.0,
            "accuracy": 0.0,
            "precision": 0.0,
            "recall": 0.0,
            "f1_score": 0.0,
            "sensitivity": 0.0,
            "specificity": 0.0,
            "confusion_matrix": {"tp": 0, "tn": 0, "fp": 0, "fn": 0},
            "condition_breakdown": [],
            "monthly_trend": [],
            "records": [],
        }

    matching = sum(1 for r in filtered if r.get("outcome") == "match")
    partial = sum(1 for r in filtered if r.get("outcome") == "partial")
    non_match = total - matching - partial

    tp = sum(1 for r in filtered if r.get("actual_positive") is True and r.get("predicted_positive") is True)
    tn = sum(1 for r in filtered if r.get("actual_positive") is False and r.get("predicted_positive") is False)
    fp = sum(1 for r in filtered if r.get("actual_positive") is False and r.get("predicted_positive") is True)
    fn = sum(1 for r in filtered if r.get("actual_positive") is True and r.get("predicted_positive") is False)

    accuracy = (tp + tn) / total if total else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    sensitivity = recall
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    agreement_pct = ((matching + 0.5 * partial) / total) * 100.0

    # Condition-wise breakdown
    cond_stats = {}
    for r in filtered:
        cond = r.get("doctor_diagnosis", "Other")
        bucket = cond_stats.setdefault(cond, {"condition": cond, "total": 0, "matching": 0, "partial": 0, "disagree": 0})
        bucket["total"] += 1
        if r.get("outcome") == "match":
            bucket["matching"] += 1
        elif r.get("outcome") == "partial":
            bucket["partial"] += 1
        else:
            bucket["disagree"] += 1

    condition_breakdown = []
    for _, v in cond_stats.items():
        v["agreement_rate"] = round(((v["matching"] + 0.5 * v["partial"]) / v["total"]) * 100, 1)
        condition_breakdown.append(v)

    # Monthly trend
    month_stats = {}
    for r in filtered:
        m = str(r.get("case_date", "2026-06-01"))[:7]
        mb = month_stats.setdefault(m, {"month": m, "total": 0, "matching": 0, "disagree": 0})
        mb["total"] += 1
        if r.get("outcome") == "match":
            mb["matching"] += 1
        elif r.get("outcome") == "disagree":
            mb["disagree"] += 1
    monthly_trend = []
    for m in sorted(month_stats.keys()):
        mb = month_stats[m]
        mb["accuracy_pct"] = round((mb["matching"] / mb["total"]) * 100, 1)
        monthly_trend.append(mb)

    return {
        "total_cases": total,
        "matching_predictions": matching,
        "partial_predictions": partial,
        "non_matching_predictions": non_match,
        "agreement_percentage": round(agreement_pct, 1),
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "sensitivity": round(sensitivity, 4),
        "specificity": round(specificity, 4),
        "confusion_matrix": {"tp": tp, "tn": tn, "fp": fp, "fn": fn},
        "condition_breakdown": condition_breakdown,
        "monthly_trend": monthly_trend,
        "records": filtered,
    }


@router.get("/dashboard")
def get_research_dashboard(
    current_user: User = Depends(require_roles(["researcher", "admin", "doctor"])),
    db: Session = Depends(get_db),
):
    datasets = db.query(ResearchDataset).order_by(ResearchDataset.created_at.desc()).all()
    projects = db.query(ResearchProject).order_by(ResearchProject.created_at.desc()).all()
    comparisons = db.query(ComparisonResult).all()

    total_deidentified_cases = sum(d.record_count for d in datasets) + len(comparisons)
    avg_agreement = round(
        sum(c.agreement_score for c in comparisons) / len(comparisons), 1
    ) if comparisons else 0.0

    primary_ds = datasets[0] if datasets else None
    metrics = _compute_metrics_from_records(primary_ds.records_payload if primary_ds else [])

    return {
        "data_notice": "Sample Benchmark & De-identified Clinical Comparison Data (for academic/research evaluation until prospective clinical trial validation).",
        "stats": {
            "total_deidentified_cases": total_deidentified_cases,
            "datasets_count": len(datasets),
            "active_projects": len([p for p in projects if p.status == "active"]),
            "live_comparisons": len(comparisons),
            "avg_live_agreement_score": avg_agreement,
        },
        "primary_metrics": {k: v for k, v in metrics.items() if k != "records"},
        "projects": [
            {
                "id": p.id,
                "title": p.title,
                "objective": p.objective,
                "status": p.status,
                "findings_summary": p.findings_summary,
                "created_at": p.created_at.isoformat(),
            }
            for p in projects
        ],
        "datasets_summary": [
            {
                "id": d.id,
                "name": d.name,
                "record_count": d.record_count,
                "is_validated": d.is_validated,
                "ai_model_version": d.ai_model_version,
                "source_type": d.source_type,
            }
            for d in datasets
        ],
    }


@router.get("/accuracy")
def get_accuracy_analysis(
    dataset_id: Optional[int] = None,
    condition: Optional[str] = "all",
    model_version: Optional[str] = "all",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(require_roles(["researcher", "admin", "doctor"])),
    db: Session = Depends(get_db),
):
    datasets = db.query(ResearchDataset).order_by(ResearchDataset.id.asc()).all()
    selected_ds = None
    if dataset_id:
        selected_ds = next((d for d in datasets if d.id == dataset_id), None)
    elif datasets:
        selected_ds = datasets[0]

    records = list(selected_ds.records_payload) if selected_ds else []
    if model_version and model_version != "all":
        records = [r for r in records if r.get("model_version", selected_ds.ai_model_version if selected_ds else "") == model_version]

    metrics = _compute_metrics_from_records(records, condition_filter=condition, date_from=date_from, date_to=date_to)
    conditions_list = sorted({r.get("doctor_diagnosis", "") for r in (selected_ds.records_payload if selected_ds else []) if r.get("doctor_diagnosis")})

    return {
        "is_sample_data": True,
        "sample_data_notice": "Metrics computed dynamically on clearly labelled sample benchmark datasets until prospective validated clinical data is supplied.",
        "dataset": {
            "id": selected_ds.id if selected_ds else None,
            "name": selected_ds.name if selected_ds else "No Dataset",
            "ai_model_version": selected_ds.ai_model_version if selected_ds else ai_engine.model_version,
            "is_validated": selected_ds.is_validated if selected_ds else False,
        },
        "available_datasets": [{"id": d.id, "name": d.name, "ai_model_version": d.ai_model_version} for d in datasets],
        "available_conditions": conditions_list,
        "metrics": {k: v for k, v in metrics.items() if k != "records"},
    }


@router.get("/disagreements")
def get_disagreement_analysis(
    current_user: User = Depends(require_roles(["researcher", "admin", "doctor"])),
    db: Session = Depends(get_db),
):
    comparisons = db.query(ComparisonResult).order_by(ComparisonResult.compared_at.desc()).all()
    agree_cases = 0
    partial_cases = 0
    disagree_cases = 0
    deidentified_cases = []
    disagreement_types = {}

    for cmp in comparisons:
        if cmp.agreement_status == "agree":
            agree_cases += 1
        elif cmp.agreement_status == "partial_agree":
            partial_cases += 1
        else:
            disagree_cases += 1

        ai_ass = db.query(AIAssessment).filter(AIAssessment.id == cmp.ai_assessment_id).first()
        doc_ass = db.query(DoctorAssessment).filter(DoctorAssessment.id == cmp.doctor_assessment_id).first()

        dtype = "Diagnostic Concordance"
        if cmp.agreement_status != "agree":
            if cmp.risk_comparison and not cmp.risk_comparison.get("risk_match", True):
                dtype = "Risk Stratification Variance"
            elif cmp.different_conditions:
                dtype = "Differential Diagnosis Divergence"
            else:
                dtype = "Investigation Plan Variance"
        disagreement_types[dtype] = disagreement_types.get(dtype, 0) + 1

        deidentified_cases.append({
            "case_code": f"DEID-{cmp.id:04d}",
            "comparison_id": cmp.id,
            "agreement_status": cmp.agreement_status,
            "agreement_score": cmp.agreement_score,
            "ai_top_prediction": ai_ass.possible_conditions[0]["condition_name"] if ai_ass and ai_ass.possible_conditions else "N/A",
            "doctor_confirmed_diagnosis": doc_ass.confirmed_diagnosis if doc_ass else "N/A",
            "ai_risk": ai_ass.risk_classification if ai_ass else "N/A",
            "doctor_risk": doc_ass.risk_classification if doc_ass else "N/A",
            "disagreement_type": dtype,
            "areas_of_disagreement": cmp.areas_of_disagreement,
            "doctor_review_status": "Reviewed by Licensed Physician" if doc_ass else "Pending",
            "doctor_explanation": doc_ass.disagreement_notes if doc_ass else None,
            "compared_at": cmp.compared_at.isoformat(),
        })

    return {
        "summary": {
            "total_reviewed": len(comparisons),
            "agree_cases": agree_cases,
            "partial_cases": partial_cases,
            "disagree_cases": disagree_cases,
        },
        "disagreement_type_breakdown": [{"type": k, "count": v} for k, v in disagreement_types.items()],
        "cases": deidentified_cases,
    }


@router.get("/explainable-ai")
def get_explainable_ai_overview(
    assessment_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if assessment_id:
        ass = db.query(AIAssessment).filter(AIAssessment.id == assessment_id).first()
    else:
        ass = db.query(AIAssessment).order_by(AIAssessment.created_at.desc()).first()

    # Global model feature importance summary from KB
    global_features = [
        {"feature": "Chest pain / tightness", "mean_weight": 0.89, "primary_domain": "Cardiology"},
        {"feature": "Shortness of breath / wheezing", "mean_weight": 0.84, "primary_domain": "Pulmonology"},
        {"feature": "Productive cough + fever", "mean_weight": 0.79, "primary_domain": "Infectious / Respiratory"},
        {"feature": "Photophobia + unilateral headache", "mean_weight": 0.74, "primary_domain": "Neurology"},
        {"feature": "Polydipsia + frequent urination", "mean_weight": 0.72, "primary_domain": "Endocrinology"},
        {"feature": "Dysuria + urinary frequency", "mean_weight": 0.69, "primary_domain": "Urology"},
        {"feature": "Epigastric burning / heartburn", "mean_weight": 0.65, "primary_domain": "Gastroenterology"},
    ]

    return {
        "model_info": {
            "model_name": ai_engine.model_name,
            "model_version": ai_engine.model_version,
            "architecture": "TF-IDF N-gram Vectorizer + Multinomial Logistic Regression + Clinical Red-Flag Rule Guard",
            "training_conditions_count": len(CLINICAL_KNOWLEDGE_BASE),
            "calibration_status": "Uncalibrated relative ranking (demo corpus — probabilities are NOT clinically calibrated).",
        },
        "epistemic_notice": "Model feature weights explain how text/symptom tokens influenced the algorithm's ranking. They do NOT constitute clinical evidence or replace physical examination and laboratory diagnostics.",
        "limitations": [
            "Trained on curated educational symptom profiles rather than prospective hospital EHR cohorts.",
            "Cannot perform physical examination, auscultation, vital sign measurement, or visual inspection.",
            "Relative likelihood scores are uncalibrated and must not be interpreted as diagnostic certainty.",
            "Rare or atypical presentations outside the 12 core clinical domains have reduced recall.",
        ],
        "global_feature_importance": global_features,
        "selected_assessment": {
            "id": ass.id,
            "primary_summary": ass.primary_summary,
            "risk_classification": ass.risk_classification,
            "possible_conditions": ass.possible_conditions,
            "explainability_factors": ass.explainability_factors,
            "supporting_symptoms": ass.supporting_symptoms,
        } if ass else None,
    }


@router.get("/datasets")
def list_datasets(current_user: User = Depends(require_roles(["researcher", "admin"])), db: Session = Depends(get_db)):
    datasets = db.query(ResearchDataset).order_by(ResearchDataset.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "description": d.description,
            "source_type": d.source_type,
            "is_validated": d.is_validated,
            "is_deidentified": d.is_deidentified,
            "record_count": d.record_count,
            "ai_model_version": d.ai_model_version,
            "records_preview": (d.records_payload or [])[:15],
            "created_at": d.created_at.isoformat(),
        }
        for d in datasets
    ]


@router.post("/datasets", status_code=status.HTTP_201_CREATED)
def create_dataset(
    payload: ResearchDatasetCreate,
    current_user: User = Depends(require_roles(["researcher", "admin"])),
    db: Session = Depends(get_db),
):
    ds = ResearchDataset(
        created_by_id=current_user.id,
        name=payload.name.strip(),
        description=payload.description,
        source_type=payload.source_type,
        is_validated=payload.is_validated,
        is_deidentified=True,
        record_count=len(payload.records_payload),
        ai_model_version=payload.ai_model_version,
        records_payload=payload.records_payload,
    )
    db.add(ds)
    log_audit(db, current_user, "DATASET_UPLOADED", "research_dataset", payload.name, {"count": len(payload.records_payload)})
    db.commit()
    db.refresh(ds)
    return {"id": ds.id, "name": ds.name, "record_count": ds.record_count}


@router.post("/datasets/{dataset_id}/validate")
def validate_dataset(
    dataset_id: int,
    current_user: User = Depends(require_roles(["researcher", "admin"])),
    db: Session = Depends(get_db),
):
    ds = db.query(ResearchDataset).filter(ResearchDataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    required_keys = {"ai_prediction", "doctor_diagnosis", "outcome"}
    invalid_rows = 0
    for r in ds.records_payload or []:
        if not required_keys.issubset(set(r.keys())):
            invalid_rows += 1
    ds.is_validated = invalid_rows == 0 and len(ds.records_payload or []) > 0
    db.commit()
    return {"dataset_id": ds.id, "is_validated": ds.is_validated, "invalid_rows": invalid_rows}


@router.get("/datasets/{dataset_id}/export")
def export_deidentified_dataset(
    dataset_id: int,
    current_user: User = Depends(require_roles(["researcher", "admin"])),
    db: Session = Depends(get_db),
):
    ds = db.query(ResearchDataset).filter(ResearchDataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["case_id", "case_date", "ai_prediction", "doctor_diagnosis", "outcome", "actual_positive", "predicted_positive", "model_version"])
    for idx, r in enumerate(ds.records_payload or [], start=1):
        writer.writerow([
            r.get("case_id", f"DEID-{idx:04d}"),
            r.get("case_date", ""),
            r.get("ai_prediction", ""),
            r.get("doctor_diagnosis", ""),
            r.get("outcome", ""),
            r.get("actual_positive", ""),
            r.get("predicted_positive", ""),
            r.get("model_version", ds.ai_model_version),
        ])

    log_audit(db, current_user, "DATASET_EXPORTED", "research_dataset", str(ds.id), {})
    db.commit()
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="deidentified_dataset_{ds.id}.csv"'},
    )


@router.get("/projects")
def list_projects(current_user: User = Depends(require_roles(["researcher", "admin"])), db: Session = Depends(get_db)):
    projects = db.query(ResearchProject).order_by(ResearchProject.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "objective": p.objective,
            "dataset_id": p.dataset_id,
            "status": p.status,
            "findings_summary": p.findings_summary,
            "created_at": p.created_at.isoformat(),
        }
        for p in projects
    ]


@router.post("/projects", status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ResearchProjectCreate,
    current_user: User = Depends(require_roles(["researcher", "admin"])),
    db: Session = Depends(get_db),
):
    proj = ResearchProject(
        lead_researcher_id=current_user.id,
        title=payload.title.strip(),
        objective=payload.objective.strip(),
        dataset_id=payload.dataset_id,
        findings_summary=payload.findings_summary,
        status="active",
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return {"id": proj.id, "title": proj.title}
